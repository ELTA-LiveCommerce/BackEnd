import { EntityManager, LoadStrategy } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AutocompleteDto, AutocompleteResultDto } from '@/module/user/dto/autocomplete.dto';
import { CreateUserDto } from '@/module/user/dto/create-user.dto';
import { PaginatedSearchResultDto, SearchUserDto, UserSearchResultDto } from '@/module/user/dto/search-user.dto';
import { ChangePasswordDto, UpdateBankInfoDto, UpdateProfileDto } from '@/module/user/dto/update-profile.dto';
import { UserSearchDto } from '@/module/user/dto/user-search.dto';
import { User } from '@/module/user/entity/user.entity';
import { UserFollowService } from '@/module/user/user-follow.service';
import { UserRole } from '@/shared/enum/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly followService: UserFollowService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new User();
    user.loginId = createUserDto.loginId;
    user.password = hashedPassword;
    user.name = createUserDto.name;
    user.role = createUserDto.role || UserRole.VIEWER;
    user.isVerified = false;

    if (createUserDto.phoneNumber) user.phoneNumber = createUserDto.phoneNumber;
    if (createUserDto.profileImage) user.profileImage = createUserDto.profileImage;
    if (createUserDto.accountNumber) user.accountNumber = createUserDto.accountNumber;
    if (createUserDto.bankName) user.bankName = createUserDto.bankName;

    await this.em.persistAndFlush(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByLoginId(loginId: string): Promise<User | null> {
    return await this.userRepository.findOne({ loginId });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    await this.em.persistAndFlush(user);
    return user;
  }

  async updateBankInfo(id: string, bankInfoDto: UpdateBankInfoDto): Promise<User> {
    const user = await this.findOne(id);

    user.bankName = bankInfoDto.bankName;
    user.accountNumber = bankInfoDto.accountNumber;

    await this.em.persistAndFlush(user);
    return user;
  }

  async verifyUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isVerified = true;
    await this.em.persistAndFlush(user);
    return user;
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateProfileDto.name) user.name = updateProfileDto.name;
    if (updateProfileDto.phoneNumber) user.phoneNumber = updateProfileDto.phoneNumber;
    if (updateProfileDto.profileImage) user.profileImage = updateProfileDto.profileImage;
    if (updateProfileDto.address) user.address = updateProfileDto.address;

    await this.em.persistAndFlush(user);
    return user;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<User> {
    const user = await this.findOne(id);

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
    }

    // 새 비밀번호 설정
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    await this.em.persistAndFlush(user);
    return user;
  }

  async uploadProfileImage(id: string, imageUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.profileImage = imageUrl;
    await this.em.persistAndFlush(user);
    return user;
  }

  /**
   * 사용자를 검색합니다. 기본적으로 셀러 역할을 가진 사용자만 검색합니다.
   * @param searchUserDto 검색 조건
   * @param currentUserId 현재 로그인한 사용자 ID (선택)
   */
  async searchUsers(searchUserDto: SearchUserDto, currentUserId?: string): Promise<PaginatedSearchResultDto> {
    const { query, role = UserRole.SELLER, page = 1, limit = 20 } = searchUserDto;
    const skip = (page - 1) * limit;

    let queryBuilder = this.userRepository.createQueryBuilder('u');

    // 역할 필터
    queryBuilder = queryBuilder.where({ role });

    // 이름 검색 필터
    if (query) {
      queryBuilder = queryBuilder.andWhere({
        $or: [{ name: { $like: `%${query}%` } }, { loginId: { $like: `%${query}%` } }],
      });
    }

    // 총 개수 조회
    const total = await queryBuilder.clone().count();

    // 결과 조회 (페이지네이션 적용)
    const users = await queryBuilder.select('*').limit(limit).offset(skip).getResult();

    // 팔로우 상태 확인
    const items: UserSearchResultDto[] = [];
    for (const user of users) {
      let isFollowing = false;
      if (currentUserId) {
        isFollowing = await this.followService.isFollowing(currentUserId, user.id);
      }

      items.push({
        id: user.id,
        name: user.name,
        loginId: user.loginId,
        profileImage: user.profileImage,
        role: user.role,
        isFollowing,
      });
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 검색어 자동완성 기능을 제공합니다.
   * 사용자 이름이나 이메일에 검색어가 포함된 사용자를 상위 몇 개 반환합니다.
   * @param autocompleteDto 자동완성 검색 조건
   */
  async autocomplete(autocompleteDto: AutocompleteDto): Promise<AutocompleteResultDto[]> {
    const { query, role = UserRole.SELLER, limit = 5 } = autocompleteDto;

    // 검색어가 없거나 짧은 경우 빈 배열 반환
    if (!query || query.length < 2) {
      return [];
    }

    // 자동완성 검색 쿼리 빌드
    let queryBuilder = this.userRepository.createQueryBuilder('u');

    // 역할 필터
    queryBuilder = queryBuilder.where({ role });

    // 이름 또는 아이디 검색
    queryBuilder = queryBuilder.andWhere({
      $or: [{ name: { $like: `%${query}%` } }, { loginId: { $like: `%${query}%` } }],
    });

    // 이름이 완전히 일치하는 경우 먼저 표시 (정확도 순으로 정렬)
    queryBuilder = queryBuilder.orderBy([
      { name: query, direction: 'DESC' }, // 이름 완전 일치가 최우선
      { name: { $like: `${query}%` }, direction: 'DESC' }, // 이름 시작 일치가 다음
      { loginId: { $like: `${query}%` }, direction: 'DESC' }, // loginId 시작 일치가 다음
    ]);

    // 상위 N개 결과만 조회
    const users = await queryBuilder.select(['id', 'name', 'loginId', 'profileImage']).limit(limit).getResult();

    // 결과 변환
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      loginId: user.loginId,
      profileImage: user.profileImage,
    }));
  }

  /**
   * 회원 관리를 위한 검색 기능
   * @param searchDto 검색 조건 (검색어, 날짜 범위, 페이지 등)
   * @returns 검색 결과 및 페이지네이션 정보
   */
  async searchForAdmin(searchDto: UserSearchDto): Promise<any> {
    const { searchTerm, startDate, endDate, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    let queryBuilder = this.userRepository.createQueryBuilder('u');

    // 검색어 필터 (아이디 또는 이름)
    if (searchTerm) {
      queryBuilder = queryBuilder.andWhere({
        $or: [{ loginId: { $like: `%${searchTerm}%` } }, { name: { $like: `%${searchTerm}%` } }],
      });
    }

    // 날짜 필터
    if (startDate && endDate) {
      queryBuilder = queryBuilder.andWhere({ createdAt: { $gte: startDate, $lte: endDate } });
    }

    // 총 개수 조회
    const total = await queryBuilder.clone().count();

    // 결과 조회 (페이지네이션 적용)
    const users = await queryBuilder.select('*').orderBy({ createdAt: 'DESC' }).limit(limit).offset(skip).getResult();

    // 사용자 데이터 처리 및 결제 정보 등 추가
    const items = await Promise.all(
      users.map(async (user) => {
        // 추가 정보 조회 (총 결제금액, 활동건수 등)
        const totalPayment = await this.calculateTotalPayment();
        const totalActiveCount = await this.calculateTotalActiveCount();

        return {
          ...user,
          totalPayment,
          totalActiveCount,
        };
      }),
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 사용자의 총 결제금액 계산
   * @returns 총 결제금액
   */
  private async calculateTotalPayment(): Promise<number> {
    // 실제 구현에서는 결제 서비스 또는 레포지토리를 통해 계산
    // 현재는 더미 데이터 반환
    await new Promise((resolve) => setTimeout(resolve, 0));
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * 사용자의 총 활동건수 계산 (주문, 리뷰 등)
   * @returns 총 활동건수
   */
  private async calculateTotalActiveCount(): Promise<number> {
    // 실제 구현에서는 주문, 리뷰 등의 서비스를 통해 계산
    // 현재는 더미 데이터 반환
    await new Promise((resolve) => setTimeout(resolve, 0));
    return Math.floor(Math.random() * 20);
  }

  /**
   * 회원 삭제 (또는 비활성화)
   * @param id 사용자 ID
   * @returns 성공 여부
   */
  async deleteUser(id: string): Promise<boolean> {
    const user = await this.findOne(id);

    // 실제 삭제 대신 비활성화 처리 (소프트 삭제)
    // user.status = UserStatus.INACTIVE; // 주석 처리
    user.deletedAt = new Date();

    await this.em.persistAndFlush(user);
    return true;
  }

  /**
   * 사용자명(username)에 키워드가 포함된 사용자를 검색합니다.
   * 주로 자동완성 기능에 사용됩니다.
   *
   * @param keyword 검색 키워드
   * @param role 사용자 역할 (기본값: 모든 역할)
   * @param limit 최대 결과 수 (기본값: 10)
   * @returns 검색된 사용자 목록
   */
  async findByUsernameContaining(keyword: string, role?: UserRole, limit = 10): Promise<User[]> {
    let queryBuilder = this.userRepository.createQueryBuilder('u');

    // 키워드로 이름 또는 이메일 검색
    queryBuilder = queryBuilder.where({
      $or: [{ name: { $like: `%${keyword}%` } }, { loginId: { $like: `%${keyword}%` } }],
    });

    // 역할 필터 적용 (지정된 경우)
    if (role) {
      queryBuilder = queryBuilder.andWhere({ role });
    }

    // 결과 제한 및 정렬 (정확도 순)
    queryBuilder = queryBuilder.orderBy([
      { name: keyword, direction: 'DESC' }, // 이름이 정확히 일치하는 항목 우선
      { name: { $like: `${keyword}%` }, direction: 'DESC' }, // 이름이 키워드로 시작하는 항목 다음
      { loginId: { $like: `${keyword}%` }, direction: 'DESC' }, // loginId 시작 일치가 다음
    ]);

    // 최대 결과 수 제한
    queryBuilder = queryBuilder.limit(limit);

    // 결과 조회
    return await queryBuilder.getResult();
  }
}
