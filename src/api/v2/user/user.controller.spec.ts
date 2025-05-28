import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../../../module/user/user.service';
import { JwtAuthGuard } from '../../../module/auth/guards/jwt-auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockUserService = {
      withdrawUser: jest.fn(),
      getSellerInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('withdraw', () => {
    it('should withdraw user successfully', async () => {
      // Given
      const req = { user: { id: 'test-user-id' } };
      userService.withdrawUser.mockResolvedValue(undefined);

      // When
      await controller.withdraw(req);

      // Then
      expect(userService.withdrawUser).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('getSellerInfo', () => {
    it('셀러 정보를 성공적으로 조회한다', async () => {
      // Given
      const currentUser = { userId: 'seller-id' };
      const mockSellerInfo = {
        businessName: 'ABC 상사',
        businessAddress: '서울시 강남구 테헤란로 123',
        businessNumber: '123-45-67890',
      };

      userService.getSellerInfo.mockResolvedValue(mockSellerInfo);

      // When
      const result = await controller.getSellerInfo(currentUser);

      // Then
      expect(userService.getSellerInfo).toHaveBeenCalledWith('seller-id');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSellerInfo);
    });

    it('부분적인 셀러 정보를 조회한다', async () => {
      // Given
      const currentUser = { userId: 'seller-id' };
      const mockSellerInfo = {
        businessName: 'ABC 상사',
        businessAddress: undefined,
        businessNumber: undefined,
      };

      userService.getSellerInfo.mockResolvedValue(mockSellerInfo);

      // When
      const result = await controller.getSellerInfo(currentUser);

      // Then
      expect(result.data).toEqual({
        businessName: 'ABC 상사',
        businessAddress: undefined,
        businessNumber: undefined,
      });
    });

    it('존재하지 않는 셀러의 경우 NotFoundException을 전파한다', async () => {
      // Given
      const currentUser = { userId: 'non-existent-seller-id' };
      userService.getSellerInfo.mockRejectedValue(
        new NotFoundException('판매자 ID non-existent-seller-id를 찾을 수 없습니다.'),
      );

      // When & Then
      await expect(controller.getSellerInfo(currentUser)).rejects.toThrow(NotFoundException);
      expect(userService.getSellerInfo).toHaveBeenCalledWith('non-existent-seller-id');
    });
  });
});

