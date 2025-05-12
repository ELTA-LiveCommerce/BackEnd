import { Test, TestingModule } from '@nestjs/testing';
import { DepositController } from './deposit.controller';
import { DepositService } from '@/module/deposit/deposit.service';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { User } from '@/module/user/entity/user.entity';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { DepositListItemDto } from '@/module/deposit/dto/deposit-list-item.dto';
import { UserRole } from '@/shared/enum/user-role.enum';
import { SellerDepositListRequestDto } from './deposit.request.dto';

const mockDepositService = {
  findSellerDepositsPaged: jest.fn(),
};

const mockJwtAuthGuard = { canActivate: jest.fn(() => true) }; // Mock guard
const mockRolesGuard = { canActivate: jest.fn(() => true) }; // Mock guard

describe('DepositController', () => {
  let controller: DepositController;
  let service: DepositService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepositController],
      providers: [
        {
          provide: DepositService,
          useValue: mockDepositService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard) // Override guards for testing
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<DepositController>(DepositController);
    service = module.get<DepositService>(DepositService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSellerDeposits', () => {
    const seller = {
      id: 'seller-id',
      role: UserRole.SELLER,
      loginId: 'seller-login',
      password: 'hashed_password',
      name: 'Seller Name',
      isVerified: true,
      phoneNumber: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      profileImage: undefined,
      accountNumber: undefined,
      bankName: undefined,
      address: undefined,
      logins: [] as any,
      following: [] as any,
      followers: [] as any,
      sellerInfo: undefined,
      blockedUsersByMe: [] as any,
      blockingSellersOfMe: [] as any,
    } as User; // Mock user
    const query: SellerDepositListRequestDto = { page: 1, limit: 10 };
    const mockResult = new PagedResponseV2<DepositListItemDto>([], 0, 1, 10);

    it('should call depositService.findSellerDepositsPaged and return the result', async () => {
      mockDepositService.findSellerDepositsPaged.mockResolvedValue(mockResult);

      const result = await controller.getSellerDeposits(query, seller);

      expect(service.findSellerDepositsPaged).toHaveBeenCalledWith(seller.id, query);
      expect(result).toBe(mockResult);
    });

    // Add tests for guards if needed (e.g., expect guard methods to have been called)
  });
});
