import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { UserService } from '@/module/user/user.service';
import { User } from '@/module/user/entity/user.entity';
import { UpdateProfileRequestDto, ProfileInfoResponseDto } from './profile.dto';
import { UserRole, UserStatus } from '@/shared/enum/user.enum';
import { mock, MockProxy } from 'jest-mock-extended';
import { Gender } from '@/module/user/entity/user-profile.entity';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';
import { Login } from '@/module/auth/entity/login.entity';

describe('ProfileController', () => {
  let controller: ProfileController;
  let userService: MockProxy<UserService>;

  const mockUser = {
    id: 'test-user-id',
    loginId: 'testLoginId',
    password: 'hashedPassword',
    name: 'Test User',
    phoneNumber: '01012345678',
    bankName: 'Test Bank',
    accountNumber: '1234567890',
    role: UserRole.VIEWER,
    status: UserStatus.ACTIVE,
    isVerified: true,
    profile: {
      id: 'test-profile-id',
      nickname: 'testNickname',
      phone: '01012345678',
      gender: Gender.MALE,
      birthDate: new Date('1990-01-01'),
      profileImageUrl: 'http://example.com/profile.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'test-user-id' } as User,
    },
    logins: [] as Login[],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User;

  beforeEach(async () => {
    userService = mock<UserService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return user profile information', async () => {
      const mockProfileInfo = {
        id: mockUser.id,
        name: mockUser.name as string,
        loginId: mockUser.loginId,
        phoneNumber: mockUser.phoneNumber || '',
        bankAccount: mockUser.accountNumber || '',
        bankName: mockUser.bankName || '',
        deliveryAddresses: [],
      };
      const expectedResponse = ProfileInfoResponseDto.success(mockProfileInfo);

      userService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getMyProfile(mockUser);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateMyProfile', () => {
    it('should update and return user profile information', async () => {
      const updateProfileDto: UpdateProfileRequestDto = {
        name: 'Updated Name',
        phoneNumber: '01087654321',
        bankName: 'Updated Bank',
        accountNumber: '0987654321',
      };

      const updatedUserMock = {
        ...mockUser,
        name: updateProfileDto.name as string,
        phoneNumber: updateProfileDto.phoneNumber as string,
        bankName: updateProfileDto.bankName as string,
        accountNumber: updateProfileDto.accountNumber as string,
      } as User;

      const expectedResponse = BaseResponseV2.success(updatedUserMock, '프로필 정보가 업데이트되었습니다.');

      userService.updateProfile.mockResolvedValue(updatedUserMock);
      userService.updateBankInfo.mockResolvedValue(updatedUserMock);

      const result = await controller.updateMyProfile(mockUser, updateProfileDto);

      expect(userService.updateProfile).toHaveBeenCalledWith(mockUser.id, {
        name: updateProfileDto.name,
        phoneNumber: updateProfileDto.phoneNumber,
      });
      expect(userService.updateBankInfo).toHaveBeenCalledWith(mockUser.id, {
        bankName: updateProfileDto.bankName,
        accountNumber: updateProfileDto.accountNumber,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should update profile without bank info if bank info is not provided', async () => {
      const updateProfileDto: UpdateProfileRequestDto = {
        name: 'Updated Name',
        phoneNumber: '01087654321',
      };

      const updatedUserMock = {
        ...mockUser,
        name: updateProfileDto.name as string,
        phoneNumber: updateProfileDto.phoneNumber as string,
      } as User;
      const expectedResponse = BaseResponseV2.success(updatedUserMock, '프로필 정보가 업데이트되었습니다.');

      userService.updateProfile.mockResolvedValue(updatedUserMock);

      const result = await controller.updateMyProfile(mockUser, updateProfileDto);

      expect(userService.updateProfile).toHaveBeenCalledWith(mockUser.id, {
        name: updateProfileDto.name,
        phoneNumber: updateProfileDto.phoneNumber,
      });
      expect(userService.updateBankInfo).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });
});
