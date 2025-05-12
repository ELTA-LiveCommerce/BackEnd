import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { UserService } from '@/module/user/user.service';
import { User } from '@/module/user/entity/user.entity';
import { UpdateProfileRequestDto, ProfileInfoDto } from './profile.dto';
import { UserRole } from '@/shared/enum/user-role.enum';
import { mock, MockProxy } from 'jest-mock-extended';
// import { Gender } from '@/module/user/entity/user-profile.entity';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';
import { Login } from '@/module/auth/entity/login.entity';
import { Follow } from '@/module/user/entity/follow.entity';
import { SellerUserBlock } from '@/module/user/entity/seller-user-block.entity';

describe('ProfileController', () => {
  let controller: ProfileController;
  let userService: MockProxy<UserService>;

  const mockUserBase = {
    loginId: 'testLoginId',
    password: 'hashedPassword',
    name: 'Test User',
    phoneNumber: '01012345678',
    bankName: 'Test Bank',
    accountNumber: '1234567890',
    address: 'Test Address, 123',
    role: UserRole.VIEWER,
    isVerified: true,
    logins: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    following: undefined as any,
    followers: undefined as any,
    blockedUsersByMe: undefined as any,
    blockingSellersOfMe: undefined as any,
  };

  // User 타입으로 캐스팅하기 전에 id를 포함한 완전한 객체를 만듭니다.
  const mockUserWithId = {
    ...mockUserBase,
    id: 'test-user-id',
  };
  const mockUser = mockUserWithId as User; // 이제 User 타입으로 캐스팅

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
      const mockProfileInfo: ProfileInfoDto = {
        id: mockUser.id,
        name: mockUser.name,
        loginId: mockUser.loginId,
        phoneNumber: mockUser.phoneNumber || '',
        bankAccount: mockUser.accountNumber || '',
        bankName: mockUser.bankName || '',
        shippingAddress: mockUser.address || '',
      };

      userService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getMyProfile(mockUser);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('프로필 정보입니다.');
      expect(result.data).toEqual(mockProfileInfo);
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });

  describe('updateMyProfile', () => {
    it('should update and return user profile information', async () => {
      const updateProfileDto: UpdateProfileRequestDto = {
        name: 'Updated Name',
        phoneNumber: '01087654321',
        shippingAddress: 'Updated Address',
        bankName: 'Updated Bank',
        accountNumber: '0987654321',
      };

      const baseForUpdate = { ...mockUserWithId };

      const updatedUserPartial = {
        ...baseForUpdate,
        name: updateProfileDto.name,
        phoneNumber: updateProfileDto.phoneNumber,
        address: updateProfileDto.shippingAddress,
      } as User;

      const updatedUserWithBank = {
        ...updatedUserPartial,
        bankName: updateProfileDto.bankName,
        accountNumber: updateProfileDto.accountNumber,
      } as User;

      const refreshedUser = { ...updatedUserWithBank } as User;

      userService.updateProfile.mockResolvedValue(updatedUserPartial);
      userService.updateBankInfo.mockResolvedValue(updatedUserWithBank);
      userService.findOne.mockResolvedValue(refreshedUser);

      const result = await controller.updateMyProfile(mockUser, updateProfileDto);

      const expectedProfileInfo: ProfileInfoDto = {
        id: refreshedUser.id,
        name: refreshedUser.name,
        loginId: refreshedUser.loginId,
        phoneNumber: refreshedUser.phoneNumber || '',
        bankAccount: refreshedUser.accountNumber || '',
        bankName: refreshedUser.bankName || '',
        shippingAddress: refreshedUser.address || '',
      };

      expect(userService.updateProfile).toHaveBeenCalledWith(mockUser.id, {
        name: updateProfileDto.name,
        phoneNumber: updateProfileDto.phoneNumber,
        address: updateProfileDto.shippingAddress,
      });
      expect(userService.updateBankInfo).toHaveBeenCalledWith(mockUser.id, {
        bankName: updateProfileDto.bankName,
        accountNumber: updateProfileDto.accountNumber,
      });
      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('프로필 정보가 업데이트되었습니다.');
      expect(result.data).toEqual(expectedProfileInfo);
      expect(result.timestamp).toEqual(expect.any(String));
    });

    it('should update profile without bank info if bank info is not provided', async () => {
      const updateProfileDto: UpdateProfileRequestDto = {
        name: 'Updated Name',
        phoneNumber: '01087654321',
        shippingAddress: 'Another Updated Address',
      };

      const baseForUpdate = { ...mockUserWithId };

      const updatedUserPartial = {
        ...baseForUpdate,
        name: updateProfileDto.name,
        phoneNumber: updateProfileDto.phoneNumber,
        address: updateProfileDto.shippingAddress,
      } as User;

      const refreshedUser = {
        ...updatedUserPartial,
        bankName: baseForUpdate.bankName,
        accountNumber: baseForUpdate.accountNumber,
      } as User;

      userService.updateProfile.mockResolvedValue(updatedUserPartial);
      userService.findOne.mockResolvedValue(refreshedUser);

      const result = await controller.updateMyProfile(mockUser, updateProfileDto);

      const expectedProfileInfo: ProfileInfoDto = {
        id: refreshedUser.id,
        name: refreshedUser.name,
        loginId: refreshedUser.loginId,
        phoneNumber: refreshedUser.phoneNumber || '',
        bankAccount: refreshedUser.accountNumber || '',
        bankName: refreshedUser.bankName || '',
        shippingAddress: refreshedUser.address || '',
      };

      expect(userService.updateProfile).toHaveBeenCalledWith(mockUser.id, {
        name: updateProfileDto.name,
        phoneNumber: updateProfileDto.phoneNumber,
        address: updateProfileDto.shippingAddress,
      });
      expect(userService.updateBankInfo).not.toHaveBeenCalled();
      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('프로필 정보가 업데이트되었습니다.');
      expect(result.data).toEqual(expectedProfileInfo);
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });
});
