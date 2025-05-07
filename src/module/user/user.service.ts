import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AutocompleteDto, AutocompleteResultDto } from '@/module/user/dto/autocomplete.dto';
import { CreateUserDto } from '@/module/user/dto/create-user.dto';
import { PaginatedSearchResultDto, SearchUserDto, UserSearchResultDto } from '@/module/user/dto/search-user.dto';
import { ChangePasswordDto, UpdateBankInfoDto, UpdateProfileDto } from '@/module/user/dto/update-profile.dto';
import { User } from '@/module/user/entity/user.entity';
import { FollowService } from '@/module/user/follow.service';
import { UserRole } from '@/shared/enum/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly followService: FollowService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new User();
    user.email = createUserDto.email;
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

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ email });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    await this.em.persistAndFlush(user);
    return user;
  }

  async updateBankInfo(id: string, bankInfoDto: UpdateBankInfoDto): Promise<User> {
    const user = await this.findOne(id);
    user.accountNumber = bankInfoDto.accountNumber;
    user.bankName = bankInfoDto.bankName;
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
        $or: [{ name: { $like: `%${query}%` } }, { email: { $like: `%${query}%` } }],
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
        email: user.email,
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

    // 이름 또는 이메일 검색
    queryBuilder = queryBuilder.andWhere({
      $or: [{ name: { $like: `%${query}%` } }, { email: { $like: `%${query}%` } }],
    });

    // 이름이 완전히 일치하는 경우 먼저 표시 (정확도 순으로 정렬)
    queryBuilder = queryBuilder.orderBy([
      { name: query, direction: 'DESC' }, // 이름 완전 일치가 최우선
      { name: { $like: `${query}%` }, direction: 'DESC' }, // 이름 시작 일치가 다음
      { email: { $like: `${query}%` }, direction: 'DESC' }, // 이메일 시작 일치가 다음
    ]);

    // 상위 N개 결과만 조회
    const users = await queryBuilder.select(['id', 'name', 'email', 'profileImage']).limit(limit).getResult();

    // 결과 변환
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    }));
  }
}
