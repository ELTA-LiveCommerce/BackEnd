import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

import { UserService } from './user.service';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockUserRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
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
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
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

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.changePassword(userId, changePasswordDto);

      expect(result.password).toEqual('hashed_password');
      expect(bcrypt.compare).toHaveBeenCalledWith(changePasswordDto.currentPassword, mockUser.password);
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
      mockUser.profileImage = null;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.uploadProfileImage(userId, imageUrl);

      expect(result.profileImage).toEqual(imageUrl);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockUser);
    });
  });
});
