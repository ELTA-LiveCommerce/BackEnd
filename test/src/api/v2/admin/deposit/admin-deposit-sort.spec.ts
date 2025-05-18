import { Test, TestingModule } from '@nestjs/testing';
import { AdminDepositController } from '@/api/v2/admin/deposit/admin-deposit.controller';
import { DepositService } from '@/module/deposit/deposit.service';
import { AdminDepositSortBy, SortOrder } from '@/api/v2/admin/deposit/dto/admin-deposit-request.dto';
import { DepositStatus } from '@/shared/enum/deposit-status.enum';

describe('AdminDepositController - Sort', () => {
  let controller: AdminDepositController;
  let depositService: DepositService;

  beforeEach(async () => {
    const mockDepositService = {
      findAllBySeller: jest.fn(),
      findOne: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDepositController],
      providers: [
        {
          provide: DepositService,
          useValue: mockDepositService,
        },
      ],
    }).compile();

    controller = module.get<AdminDepositController>(AdminDepositController);
    depositService = module.get<DepositService>(DepositService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDepositList', () => {
    it('should sort by product name ASC', async () => {
      const mockResult = {
        deposits: [
          { id: '1', product: { name: 'Product A' }, quantity: 2, amount: 10000 },
          { id: '2', product: { name: 'Product B' }, quantity: 3, amount: 20000 },
        ],
        total: 2,
      };

      (depositService.findAllBySeller as jest.Mock).mockResolvedValue(mockResult);

      await controller.getDepositList({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        sortBy: AdminDepositSortBy.PRODUCT_NAME,
        sortOrder: SortOrder.ASC,
      });

      expect(depositService.findAllBySeller).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        search: undefined,
        sortBy: AdminDepositSortBy.PRODUCT_NAME,
        sortOrder: SortOrder.ASC,
      });
    });

    it('should sort by quantity DESC', async () => {
      const mockResult = {
        deposits: [
          { id: '2', product: { name: 'Product B' }, quantity: 3, amount: 20000 },
          { id: '1', product: { name: 'Product A' }, quantity: 2, amount: 10000 },
        ],
        total: 2,
      };

      (depositService.findAllBySeller as jest.Mock).mockResolvedValue(mockResult);

      await controller.getDepositList({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        sortBy: AdminDepositSortBy.QUANTITY,
        sortOrder: SortOrder.DESC,
      });

      expect(depositService.findAllBySeller).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        search: undefined,
        sortBy: AdminDepositSortBy.QUANTITY,
        sortOrder: SortOrder.DESC,
      });
    });

    it('should sort by amount ASC', async () => {
      const mockResult = {
        deposits: [
          { id: '1', product: { name: 'Product A' }, quantity: 2, amount: 10000 },
          { id: '2', product: { name: 'Product B' }, quantity: 3, amount: 20000 },
        ],
        total: 2,
      };

      (depositService.findAllBySeller as jest.Mock).mockResolvedValue(mockResult);

      await controller.getDepositList({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        sortBy: AdminDepositSortBy.AMOUNT,
        sortOrder: SortOrder.ASC,
      });

      expect(depositService.findAllBySeller).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        search: undefined,
        sortBy: AdminDepositSortBy.AMOUNT,
        sortOrder: SortOrder.ASC,
      });
    });

    it('should use default sorting when not specified', async () => {
      const mockResult = {
        deposits: [
          { id: '1', product: { name: 'Product A' }, quantity: 2, amount: 10000 },
          { id: '2', product: { name: 'Product B' }, quantity: 3, amount: 20000 },
        ],
        total: 2,
      };

      (depositService.findAllBySeller as jest.Mock).mockResolvedValue(mockResult);

      await controller.getDepositList({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
      });

      expect(depositService.findAllBySeller).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });
  });

  describe('updateDepositStatus', () => {
    it('should call depositService.updateStatus with correct parameters', async () => {
      const mockDeposit = {
        id: '1',
        quantity: 2,
        amount: 10000,
        depositedAt: new Date(),
        status: DepositStatus.COMPLETED,
        product: {
          id: 'product-1',
          name: 'Product A',
          imageUrl: 'https://example.com/image.jpg',
        },
        seller: {
          id: 'seller-1',
          name: 'Seller',
        },
      };

      (depositService.updateStatus as jest.Mock).mockResolvedValue(mockDeposit);

      await controller.updateDepositStatus('1', { status: DepositStatus.COMPLETED });

      expect(depositService.updateStatus).toHaveBeenCalledWith('1', DepositStatus.COMPLETED);
    });

    it('should call depositService.updateStatus for REJECTED status', async () => {
      const mockDeposit = {
        id: '1',
        quantity: 2,
        amount: 10000,
        depositedAt: new Date(),
        status: DepositStatus.REJECTED,
        product: {
          id: 'product-1',
          name: 'Product A',
          imageUrl: 'https://example.com/image.jpg',
        },
        seller: {
          id: 'seller-1',
          name: 'Seller',
        },
      };

      (depositService.updateStatus as jest.Mock).mockResolvedValue(mockDeposit);

      await controller.updateDepositStatus('1', { status: DepositStatus.REJECTED });

      expect(depositService.updateStatus).toHaveBeenCalledWith('1', DepositStatus.REJECTED);
    });
  });
});

