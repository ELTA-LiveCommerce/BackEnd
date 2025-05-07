import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { AutocompleteDto } from '@/module/user/dto/autocomplete.dto';
import { User } from '@/module/user/entity/user.entity';
import { FollowService } from '@/module/user/follow.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { UserService } from './user.service';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;
  let mockFollowService: any;
  let mockEntityManager: any;

  const mockUsers = [
    {
      id: 'user-id-1',
      name: '김판매',
      email: 'seller1@example.com',
      profileImage: null,
      role: UserRole.SELLER,
    },
    {
      id: 'user-id-2',
      name: '박판매',
      email: 'seller2@example.com',
      profileImage: null,
      role: UserRole.SELLER,
    },
    {
      id: 'user-id-3',
      name: '최사용자',
      email: 'user1@example.com',
      profileImage: null,
      role: UserRole.VIEWER,
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
      findOne: jest.fn().mockImplementation((criteria) => {
        const user = mockUsers.find((u) => u.id === criteria.id);
        return Promise.resolve(user || null);
      }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    mockFollowService = {
      isFollowing: jest.fn().mockResolvedValue(false),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: FollowService,
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
      const createUserDto = {
        email: 'test@example.com',
        password: 'TestPass1!',
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        accountNumber: '123-456-789012',
        bankName: '신한은행',
      };

      const expectedUser = new User();
      expectedUser.email = createUserDto.email;
      expectedUser.password = 'hashed_password';
      expectedUser.name = createUserDto.name;
      expectedUser.phoneNumber = createUserDto.phoneNumber;
      expectedUser.accountNumber = createUserDto.accountNumber;
      expectedUser.bankName = createUserDto.bankName;
      expectedUser.role = UserRole.VIEWER;
      expectedUser.isVerified = false;

      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(createUserDto);

      expect(result).toEqual(
        expect.objectContaining({
          email: createUserDto.email,
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
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe(mockUsers[0].name);
      expect(result[1].name).toBe(mockUsers[1].name);
    });

    it('should limit results to specified number', async () => {
      const dto: AutocompleteDto = { query: '판매', role: UserRole.SELLER, limit: 1 };

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getResult: jest.fn().mockResolvedValue([mockUsers[0]]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValueOnce(queryBuilderMock);

      const result = await service.autocomplete(dto);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockUsers[0].name);
    });
  });
});
