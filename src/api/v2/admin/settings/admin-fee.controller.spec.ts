import { Test, TestingModule } from '@nestjs/testing';
import { AdminFeeController } from './admin-fee.controller';
import { UserService } from '@/module/user/user.service';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { AdminFeeListRequest, AdminFeeSortBy, SortOrder, AdminUpdateFeeRequest } from './dto/admin-fee-request.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminFeeController', () => {
  let controller: AdminFeeController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminFeeController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminFeeController>(AdminFeeController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFees', () => {
    it('셀러 수수료 목록을 반환해야 함', async () => {
      // Given
      const query: AdminFeeListRequest = {
        page: 1,
        limit: 10,
        search: '',
        sortBy: AdminFeeSortBy.SELLER_NAME,
        sortOrder: SortOrder.ASC,
      };

      const mockUsers = [
        {
          id: 'user-1',
          name: '판매자 1',
          phoneNumber: '01012345678',
          bankAccount: '국민은행 123-456-789',
          feePercentage: 0.1,
          role: UserRole.SELLER,
        } as User,
        {
          id: 'user-2',
          name: '판매자 2',
          phoneNumber: '01098765432',
          bankAccount: '신한은행 987-654-321',
          feePercentage: 0.15,
          role: UserRole.SELLER,
        } as User,
      ];

      const mockResult = {
        users: mockUsers,
        total: mockUsers.length,
      };

      jest.spyOn(userService, 'findAll').mockResolvedValue(mockResult);

      // When
      const result = await controller.getFees(query);

      // Then
      expect(userService.findAll).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        role: UserRole.SELLER,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
      expect(result.data).toBeDefined();
      expect(result.data.items.length).toBe(mockUsers.length);
      expect(result.data.total).toBe(mockUsers.length);
    });
  });

  describe('getFee', () => {
    it('셀러 ID로 수수료 정보를 반환해야 함', async () => {
      // Given
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        name: '판매자 1',
        phoneNumber: '01012345678',
        bankAccount: '국민은행 123-456-789',
        feePercentage: 0.1,
        role: UserRole.SELLER,
      } as User;

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      // When
      const result = await controller.getFee(userId);

      // Then
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(result.data).toBeDefined();
      expect(result.data.data.id).toBe(userId);
      expect(result.data.data.feePercentage).toBe(mockUser.feePercentage);
    });

    it('존재하지 않는 ID로 요청시 NotFoundException을 던져야 함', async () => {
      // Given
      const userId = 'non-existent-id';
      jest.spyOn(userService, 'findOne').mockImplementation(() => {
        throw new NotFoundException(`User with ID ${userId} not found`);
      });

      // When, Then
      await expect(controller.getFee(userId)).rejects.toThrow(NotFoundException);
    });

    it('셀러가 아닌 사용자 ID로 요청시 BadRequestException을 던져야 함', async () => {
      // Given
      const userId = 'viewer-id';
      const mockUser = {
        id: userId,
        name: '일반 사용자',
        role: UserRole.VIEWER,
      } as User;

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      // When, Then
      await expect(controller.getFee(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateFee', () => {
    it('셀러의 수수료를 업데이트해야 함', async () => {
      // Given
      const userId = 'user-1';
      const updateDto: AdminUpdateFeeRequest = {
        feePercentage: 0.2,
      };

      const mockUser = {
        id: userId,
        name: '판매자 1',
        phoneNumber: '01012345678',
        bankAccount: '국민은행 123-456-789',
        feePercentage: 0.1,
        role: UserRole.SELLER,
      } as User;

      const updatedMockUser = {
        ...mockUser,
        feePercentage: updateDto.feePercentage,
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'update').mockResolvedValue(updatedMockUser);

      // When
      const result = await controller.updateFee(userId, updateDto);

      // Then
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(userService.update).toHaveBeenCalledWith(userId, {
        feePercentage: updateDto.feePercentage,
      });
      expect(result.data).toBeDefined();
      expect(result.data.data.feePercentage).toBe(updateDto.feePercentage);
    });

    it('존재하지 않는 ID로 업데이트 요청시 NotFoundException을 던져야 함', async () => {
      // Given
      const userId = 'non-existent-id';
      const updateDto: AdminUpdateFeeRequest = {
        feePercentage: 0.2,
      };

      jest.spyOn(userService, 'findOne').mockImplementation(() => {
        throw new NotFoundException(`User with ID ${userId} not found`);
      });

      // When, Then
      await expect(controller.updateFee(userId, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('셀러가 아닌 사용자 ID로 업데이트 요청시 BadRequestException을 던져야 함', async () => {
      // Given
      const userId = 'viewer-id';
      const updateDto: AdminUpdateFeeRequest = {
        feePercentage: 0.2,
      };

      const mockUser = {
        id: userId,
        name: '일반 사용자',
        role: UserRole.VIEWER,
      } as User;

      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      // When, Then
      await expect(controller.updateFee(userId, updateDto)).rejects.toThrow(BadRequestException);
    });
  });
});

