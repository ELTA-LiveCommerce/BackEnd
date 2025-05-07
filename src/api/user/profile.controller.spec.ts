import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UpdateBankInfoDto, UpdateProfileDto } from '@/module/user/dto/update-profile.dto';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { ProfileController } from './profile.controller';

describe('ProfileController', () => {
  let controller: ProfileController;
  let userService: UserService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: '홍길동',
    password: 'hashedpassword',
    role: UserRole.VIEWER,
    isVerified: false,
    phoneNumber: '010-1234-5678',
    accountNumber: '123-456-789012',
    bankName: '신한은행',
    profileImage: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    logins: undefined,
  } as unknown as User;

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const mockUserService = {
      findOne: jest.fn((id: string) => Promise.resolve({ ...mockUser })),
      updateProfile: jest.fn((id: string, dto: UpdateProfileDto) => {
        const updatedUser = { ...mockUser };
        if (dto.name) updatedUser.name = dto.name;
        if (dto.phoneNumber) updatedUser.phoneNumber = dto.phoneNumber;
        if (dto.profileImage) updatedUser.profileImage = dto.profileImage;
        return Promise.resolve(updatedUser);
      }),
      updateBankInfo: jest.fn((id: string, dto: UpdateBankInfoDto) => {
        const updatedUser = { ...mockUser };
        updatedUser.accountNumber = dto.accountNumber;
        updatedUser.bankName = dto.bankName;
        return Promise.resolve(updatedUser);
      }),
      changePassword: jest.fn((id: string, dto: any) => Promise.resolve({ ...mockUser })),
      uploadProfileImage: jest.fn((id: string, imageUrl: string) => {
        const updatedUser = { ...mockUser };
        updatedUser.profileImage = imageUrl;
        return Promise.resolve(updatedUser);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return the authenticated user profile', async () => {
      const result = await controller.getMyProfile(mockRequest as any);
      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user profile', async () => {
      const updateProfileDto: UpdateProfileDto = {
        name: '김철수',
        phoneNumber: '010-9876-5432',
      };

      const updatedUser = {
        ...mockUser,
        name: updateProfileDto.name,
        phoneNumber: updateProfileDto.phoneNumber,
      };

      jest.spyOn(userService, 'updateProfile').mockResolvedValue(updatedUser as User);

      const result = await controller.updateProfile(mockRequest as any, updateProfileDto);
      expect(result).toEqual(updatedUser);
      expect(userService.updateProfile).toHaveBeenCalledWith(mockUser.id, updateProfileDto);
    });
  });

  describe('updateBankInfo', () => {
    it('should update and return the user bank info', async () => {
      const updateBankInfoDto: UpdateBankInfoDto = {
        accountNumber: '987-654-321098',
        bankName: '국민은행',
      };

      const updatedUser = {
        ...mockUser,
        accountNumber: updateBankInfoDto.accountNumber,
        bankName: updateBankInfoDto.bankName,
      };

      jest.spyOn(userService, 'updateBankInfo').mockResolvedValue(updatedUser as User);

      const result = await controller.updateBankInfo(mockRequest as any, updateBankInfoDto);
      expect(result).toEqual(updatedUser);
      expect(userService.updateBankInfo).toHaveBeenCalledWith(mockUser.id, updateBankInfoDto);
    });
  });

  describe('changePassword', () => {
    it('should return success message when password is changed', async () => {
      const changePasswordDto = {
        currentPassword: 'CurrentPass1!',
        newPassword: 'NewPass1!',
      };

      jest.spyOn(userService, 'changePassword').mockResolvedValue(mockUser);

      const result = await controller.changePassword(mockRequest as any, changePasswordDto);
      expect(result).toEqual({ success: true });
      expect(userService.changePassword).toHaveBeenCalledWith(mockUser.id, changePasswordDto);
    });
  });

  describe('uploadProfileImage', () => {
    it('should update profile image when file is provided', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
        filename: 'test-uuid.jpg',
      } as Express.Multer.File;

      const imageUrl = 'http://localhost:3000/uploads/profiles/test-uuid.jpg';
      const updatedUser = { ...mockUser, profileImage: imageUrl };

      jest.spyOn(userService, 'uploadProfileImage').mockResolvedValue(updatedUser as User);

      // 환경변수 설정을 모의
      const originalEnv = process.env.SERVER_URL;
      process.env.SERVER_URL = 'http://localhost:3000';

      try {
        const result = await controller.uploadProfileImage(mockRequest as any, mockFile);
        expect(result).toEqual({ imageUrl: expect.stringContaining('/uploads/profiles/') });
        expect(userService.uploadProfileImage).toHaveBeenCalledWith(
          mockUser.id,
          expect.stringContaining('/uploads/profiles/'),
        );
      } finally {
        // 환경변수 복원
        process.env.SERVER_URL = originalEnv;
      }
    });

    it('should throw BadRequestException when no file is provided', async () => {
      // 빈 파일 객체 생성 (undefined 대신 사용)
      const emptyFile = undefined as unknown as Express.Multer.File;

      await expect(controller.uploadProfileImage(mockRequest as any, emptyFile)).rejects.toThrow(BadRequestException);
      expect(userService.uploadProfileImage).not.toHaveBeenCalled();
    });
  });
});
