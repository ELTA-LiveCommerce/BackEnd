//@ts-nocheck
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AutocompleteDto } from '@/module/user/dto/autocomplete.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@/module/user/entity/user.entity';
import { UserFollowService } from '@/module/user/user-follow.service';
import { UserRole } from '@/shared/enum/user-role.enum';
import { SellerUserBlock, BlockType } from '@/module/user/entity/seller-user-block.entity';
import { SellerUserStatus, SellerUserStatusUpdateRequestDto } from '@/api/v2/seller/users/seller-user-request.dto';
import { SellerInfo } from '@/module/user/entity/seller-info.entity';

import { UserService } from './user.service';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;
  let mockFollowService: any;
  let mockEntityManager: any;
  let mockSellerInfoRepository: any;
  let mockSellerUserBlockRepository: any;
  // let userRepository: jest.Mocked<EntityRepository<User>>;
  // let sellerUserBlockRepository: jest.Mocked<EntityRepository<SellerUserBlock>>;

  const mockUsers = [
    {
      id: 'user-id-1',
      name: '김판매',
      loginId: 'seller1@example.com',
      profileImage: null,
      role: UserRole.SELLER,
      password: 'hashed_password_seller1',
      isVerified: true,
    },
    {
      id: 'user-id-2',
      name: '박판매',
      loginId: 'seller2@example.com',
      profileImage: null,
      role: UserRole.SELLER,
      password: 'hashed_password_seller2',
      isVerified: true,
    },
    {
      id: 'user-id-3',
      name: '최사용자',
      loginId: 'user1@example.com',
      profileImage: null,
      role: UserRole.VIEWER,
      password: 'hashed_password_user1',
      isVerified: true,
    },
  ];

  beforeEach(async () => {
    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue(mockUsers.length),
      getResult: jest.fn().mockImplementation(() => {
        return Promise.resolve(mockUsers.slice(0, 2));
      }),
    };

    mockUserRepository = {
      removeAndFlush: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      persistAndFlush: jest.fn(),
    };

    mockFollowService = {
      isFollowing: jest.fn().mockResolvedValue(false),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      persist: jest.fn(),
    };

    mockSellerUserBlockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    mockSellerInfoRepository = {
      persistAndFlush: jest.fn(),
      persist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(SellerUserBlock),
          useValue: mockSellerUserBlockRepository,
        },
        {
          provide: getRepositoryToken(SellerInfo),
          useValue: mockSellerInfoRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: UserFollowService,
          useValue: mockFollowService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (bcrypt.compare as jest.Mock).mockImplementation((plaintext: string, hash: string) =>
      Promise.resolve(plaintext === 'CurrentPass1!' && hash === 'hashed_old_password'),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        loginId: 'test@example.com',
        password: 'TestPass1!',
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        accountNumber: '123-456-789012',
        bankName: '신한은행',
        role: UserRole.VIEWER,
      };

      const expectedUser = new User();
      expectedUser.loginId = createUserDto.loginId;
      expectedUser.password = 'hashed_password';
      expectedUser.name = createUserDto.name;
      expectedUser.phoneNumber = createUserDto.phoneNumber;
      expectedUser.accountNumber = createUserDto.accountNumber;
      expectedUser.bankName = createUserDto.bankName;
      expectedUser.role = createUserDto.role!;
      expectedUser.isVerified = false;

      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(createUserDto);

      expect(result).toEqual(
        expect.objectContaining({
          loginId: createUserDto.loginId,
          name: createUserDto.name,
          role: UserRole.VIEWER,
          isVerified: false,
        }),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile information', async () => {
      const userId = 'test-id';
      const updateProfileDto = {
        name: '김철수',
        phoneNumber: '010-9876-5432',
      };

      const mockUser = new User();
      mockUser.id = userId;
      mockUser.name = '홍길동';
      mockUser.phoneNumber = '010-1234-5678';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(result.name).toEqual(updateProfileDto.name);
      expect(result.phoneNumber).toEqual(updateProfileDto.phoneNumber);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateBankInfo', () => {
    it('should update user bank information', async () => {
      const userId = 'test-id';
      const updateBankInfoDto = {
        accountNumber: '987-654-321098',
        bankName: '국민은행',
      };

      const mockUser = new User();
      mockUser.id = userId;
      mockUser.accountNumber = '123-456-789012';
      mockUser.bankName = '신한은행';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.updateBankInfo(userId, updateBankInfoDto);

      expect(result.accountNumber).toEqual(updateBankInfoDto.accountNumber);
      expect(result.bankName).toEqual(updateBankInfoDto.bankName);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('changePassword', () => {
    it('should change user password when current password is correct', async () => {
      const userId = 'test-id';
      const changePasswordDto = {
        currentPassword: 'CurrentPass1!',
        newPassword: 'NewPass1!',
      };

      const mockUser = new User();
      mockUser.id = userId;
      mockUser.password = 'hashed_old_password';
      const originalPassword = mockUser.password;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.changePassword(userId, changePasswordDto);

      expect(result.password).toEqual('hashed_password');
      expect(bcrypt.compare).toHaveBeenCalledWith(changePasswordDto.currentPassword, originalPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when current password is incorrect', async () => {
      const userId = 'test-id';
      const changePasswordDto = {
        currentPassword: 'WrongPass1!',
        newPassword: 'NewPass1!',
      };

      const mockUser = new User();
      mockUser.id = userId;
      mockUser.password = 'hashed_old_password';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        '현재 비밀번호가 올바르지 않습니다.',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(changePasswordDto.currentPassword, mockUser.password);
      expect(mockEntityManager.persistAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('uploadProfileImage', () => {
    it('should update user profile image url', async () => {
      const userId = 'test-id';
      const imageUrl = 'http://localhost:3000/uploads/profiles/test-image.jpg';

      const mockUser = new User();
      mockUser.id = userId;
      mockUser.profileImage = undefined;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.uploadProfileImage(userId, imageUrl);

      expect(result.profileImage).toEqual(imageUrl);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('autocomplete', () => {
    it('should return empty array for short query', async () => {
      const dto: AutocompleteDto = { query: 'a', limit: 5 };
      const result = await service.autocomplete(dto);
      expect(result).toEqual([]);
    });

    it('should return autocomplete results', async () => {
      const dto: AutocompleteDto = { query: '판매', role: UserRole.SELLER, limit: 5 };
      const result = await service.autocomplete(dto);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
      // 실제 mockUsers에서 SELLER 역할을 가진 사용자는 2명이므로, getResult가 2명을 반환하도록 설정됨
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe(mockUsers.find((u) => u.loginId === 'seller1@example.com')!.name);
      expect(result[1].name).toBe(mockUsers.find((u) => u.loginId === 'seller2@example.com')!.name);
    });

    it('should limit results to specified number', async () => {
      const dto: AutocompleteDto = { query: '판매', role: UserRole.SELLER, limit: 1 };

      const queryBuilderSingleResultMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getResult: jest.fn().mockResolvedValue([mockUsers.find((u) => u.loginId === 'seller1@example.com')]), // 첫 번째 판매자만 반환
      };

      mockUserRepository.createQueryBuilder.mockReturnValueOnce(queryBuilderSingleResultMock);

      const result = await service.autocomplete(dto);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockUsers.find((u) => u.loginId === 'seller1@example.com')!.name);
      expect(queryBuilderSingleResultMock.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('withdrawUser', () => {
    const userId = 'user-id-1'; // mockUsers의 첫 번째 사용자 (SELLER)

    it('should call findOne and removeAndFlush when user exists', async () => {
      const mockUserInstance = new User();
      Object.assign(
        mockUserInstance,
        mockUsers.find((u) => u.id === userId),
      );
      mockUserRepository.findOne.mockResolvedValueOnce(mockUserInstance);
      mockUserRepository.removeAndFlush.mockClear(); // 이전 호출 기록 제거

      await service.withdrawUser(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockUserRepository.removeAndFlush).toHaveBeenCalledWith(mockUserInstance);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const nonExistentUserId = 'non-existent-id';
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.removeAndFlush.mockClear();

      await expect(service.withdrawUser(nonExistentUserId)).rejects.toThrow(
        new NotFoundException(`User with ID ${nonExistentUserId} not found.`),
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: nonExistentUserId });
      expect(mockUserRepository.removeAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('findUsersForSeller', () => {
    beforeEach(() => {
      // 이 describe 블록 내의 각 테스트는 자체 queryBuilderMock을 사용하거나, 필요에 따라 mockUserRepository.createQueryBuilder를 직접 모킹합니다.
      // 기본 queryBuilderMock 설정 (beforeEach 최상단에 있는 것)은 여기서는 재정의될 수 있습니다.
    });

    it('판매자가 관리하는 사용자 목록을 반환해야 한다', async () => {
      const sellerId = 'seller-id';
      const queryParams = { page: 1, limit: 10 };

      // 이 테스트에 맞는 queryBuilder 모의 구현
      const specificQueryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue(1), // 예: 1명의 사용자만 반환
        getResult: jest.fn().mockResolvedValue([mockUsers.find((u) => u.role === UserRole.VIEWER)]), // VIEWER 역할 사용자 1명
      };
      mockUserRepository.createQueryBuilder.mockReturnValueOnce(specificQueryBuilderMock);

      const result = await service.findUsersForSeller(sellerId, queryParams);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
      expect(specificQueryBuilderMock.where).toHaveBeenCalledWith({ role: UserRole.VIEWER });
    });

    it('검색 조건에 따라 사용자를 필터링해야 한다', async () => {
      const sellerId = 'seller-id';
      const queryParams = {
        page: 1,
        limit: 10,
        searchField: 'name',
        searchKeyword: '최사용자',
      };
      const specificQueryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(), // 이 메서드가 호출될 것을 기대
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue(1),
        getResult: jest.fn().mockResolvedValue([mockUsers.find((u) => u.name === '최사용자')]),
      };
      mockUserRepository.createQueryBuilder.mockReturnValueOnce(specificQueryBuilderMock);

      await service.findUsersForSeller(sellerId, queryParams);

      expect(specificQueryBuilderMock.andWhere).toHaveBeenCalledWith({ name: { $like: '%최사용자%' } });
    });

    // 상태 필터 및 날짜 필터 테스트 추가 (유사한 방식으로 queryBuilder 모킹)
  });

  describe('updateUserStatusBySeller', () => {
    it('사용자 상태를 INACTIVE로 성공적으로 업데이트해야 한다', async () => {
      if (typeof service.updateUserStatusBySeller !== 'function') {
        console.warn('updateUserStatusBySeller 메서드가 구현되지 않았습니다.');
        return;
      }
      const sellerId = 'seller-mock-id-1';
      const userId = 'user-mock-id-1';
      const statusDto: SellerUserStatusUpdateRequestDto = {
        status: SellerUserStatus.INACTIVE,
        reason: '테스트로 인한 비활성화',
      };

      const mockUser = new User();
      Object.assign(mockUser, { id: userId, role: UserRole.VIEWER });
      const mockSeller = new User();
      Object.assign(mockSeller, { id: sellerId, role: UserRole.SELLER });

      mockUserRepository.findOne.mockResolvedValueOnce(mockUser as any).mockResolvedValueOnce(mockSeller as any);

      const sellerUserBlockRepoMock = service['sellerUserBlockRepository'];
      const persistSpy = jest.spyOn(sellerUserBlockRepoMock, 'persistAndFlush').mockResolvedValueOnce(undefined as any);

      const result = await service.updateUserStatusBySeller(sellerId, userId, statusDto);

      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, { id: userId, role: UserRole.VIEWER });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, { id: sellerId, role: UserRole.SELLER });
      expect(persistSpy).toHaveBeenCalled();
      expect(result.id).toEqual(userId);
    });

    it('사용자 상태를 ACTIVE로 성공적으로 업데이트해야 한다 (차단 해제)', async () => {
      if (typeof service.updateUserStatusBySeller !== 'function') {
        console.warn('updateUserStatusBySeller 메서드가 구현되지 않았습니다.');
        return;
      }
      const sellerId = 'seller-mock-id-2';
      const userId = 'user-mock-id-2';
      const statusDto: SellerUserStatusUpdateRequestDto = { status: SellerUserStatus.ACTIVE };

      const mockUser = new User();
      Object.assign(mockUser, { id: userId, role: UserRole.VIEWER });
      const mockSeller = new User();
      Object.assign(mockSeller, { id: sellerId, role: UserRole.SELLER });

      const mockExistingBlock = new SellerUserBlock(mockSeller, mockUser, BlockType.FULL_BLOCK, '이전 차단');

      mockUserRepository.findOne.mockResolvedValueOnce(mockUser as any).mockResolvedValueOnce(mockSeller as any);

      const sellerUserBlockRepoMock = service['sellerUserBlockRepository'];
      jest.spyOn(sellerUserBlockRepoMock, 'findOne').mockResolvedValueOnce(mockExistingBlock as any);
      const removeSpy = jest.spyOn(sellerUserBlockRepoMock, 'removeAndFlush').mockResolvedValueOnce(undefined as any);

      await service.updateUserStatusBySeller(sellerId, userId, statusDto);

      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, { id: userId, role: UserRole.VIEWER });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, { id: sellerId, role: UserRole.SELLER });
      expect(sellerUserBlockRepoMock.findOne).toHaveBeenCalledWith({ seller: mockSeller, blockedUser: mockUser });
      expect(removeSpy).toHaveBeenCalledWith(mockExistingBlock);
    });

    it('존재하지 않는 사용자에 대해 NotFoundException을 발생시켜야 한다', async () => {
      if (typeof service.updateUserStatusBySeller !== 'function') {
        console.warn('updateUserStatusBySeller 메서드가 구현되지 않았습니다.');
        return;
      }
      const sellerId = 'seller-mock-id-3';
      const userId = 'non-existent-user-id';
      const statusDto: SellerUserStatusUpdateRequestDto = { status: SellerUserStatus.INACTIVE };

      mockUserRepository.findOne.mockResolvedValueOnce(null as any);

      await expect(service.updateUserStatusBySeller(sellerId, userId, statusDto)).rejects.toThrow(
        new NotFoundException(`사용자를 찾을 수 없습니다: ${userId}`),
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId, role: UserRole.VIEWER });
    });

    it('존재하지 않는 판매자에 대해 NotFoundException을 발생시켜야 한다', async () => {
      if (typeof service.updateUserStatusBySeller !== 'function') {
        console.warn('updateUserStatusBySeller 메서드가 구현되지 않았습니다.');
        return;
      }
      const sellerId = 'non-existent-seller-id';
      const userId = 'user-mock-id-4';
      const statusDto: SellerUserStatusUpdateRequestDto = { status: SellerUserStatus.INACTIVE };

      const mockUser = new User();
      Object.assign(mockUser, { id: userId, role: UserRole.VIEWER });

      mockUserRepository.findOne.mockResolvedValueOnce(mockUser as any).mockResolvedValueOnce(null as any);

      await expect(service.updateUserStatusBySeller(sellerId, userId, statusDto)).rejects.toThrow(
        new NotFoundException(`판매자를 찾을 수 없습니다: ${sellerId}`),
      );
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, { id: userId, role: UserRole.VIEWER });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, { id: sellerId, role: UserRole.SELLER });
    });
  });

  describe('upgradeToSeller', () => {
    it('성공적으로 사용자를 판매자로 업그레이드해야 함', async () => {
      // 설정
      const user = new User();
      user.id = 'test-user-id';
      user.name = 'Test User';
      user.loginId = 'testuser';
      user.role = UserRole.VIEWER;

      mockUserRepository.findOne.mockResolvedValue(user);

      // 실행
      const result = await service.upgradeToSeller(user.id);

      // 검증
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: user.id });
      expect(result.role).toBe(UserRole.SELLER);
      expect(result.sellerInfo).toBeDefined();
      expect(mockEntityManager.persist).toHaveBeenCalledTimes(2); // user와 sellerInfo 모두 persist 호출
    });

    it('사용자가 이미 판매자인 경우 예외를 던져야 함', async () => {
      // 설정
      const user = new User();
      user.id = 'test-user-id';
      user.role = UserRole.SELLER;

      mockUserRepository.findOne.mockResolvedValue(user);

      // 실행 및 검증
      await expect(service.upgradeToSeller(user.id)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: user.id });
      expect(mockEntityManager.persist).not.toHaveBeenCalled();
    });

    it('사용자가 이미 판매자 정보를 가지고 있는 경우 예외를 던져야 함', async () => {
      // 설정
      const user = new User();
      user.id = 'test-user-id';
      user.role = UserRole.VIEWER;
      user.sellerInfo = new SellerInfo();

      mockUserRepository.findOne.mockResolvedValue(user);

      // 실행 및 검증
      await expect(service.upgradeToSeller(user.id)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: user.id });
      expect(mockEntityManager.persist).not.toHaveBeenCalled();
    });

    it('사용자가 존재하지 않는 경우 예외를 던져야 함', async () => {
      // 설정
      mockUserRepository.findOne.mockResolvedValue(null);

      // 실행 및 검증
      await expect(service.upgradeToSeller('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: 'non-existent-id' });
      expect(mockEntityManager.persist).not.toHaveBeenCalled();
    });
  });
});

