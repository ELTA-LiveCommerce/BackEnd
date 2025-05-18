import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductController } from '@/api/v2/admin/product/admin-product.controller';
import { ProductService } from '@/module/product/product.service';
import { UserService } from '@/module/user/user.service';
import { AdminProductSortBy, SortOrder } from '@/api/v2/admin/product/dto/admin-product-request.dto';

describe('AdminProductController - Sort', () => {
  let controller: AdminProductController;
  let productService: ProductService;

  beforeEach(async () => {
    const mockProductService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockUserService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<AdminProductController>(AdminProductController);
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('should sort by name ASC', async () => {
      const mockResult = {
        items: [
          { id: '1', name: 'Product A', price: 100 },
          { id: '2', name: 'Product B', price: 200 },
        ],
        total: 2,
      };

      (productService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.getProducts({
        page: 1,
        limit: 10,
        sortBy: AdminProductSortBy.NAME,
        sortOrder: SortOrder.ASC,
      });

      expect(productService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: AdminProductSortBy.NAME,
        sortOrder: SortOrder.ASC,
      });
    });

    it('should sort by price DESC', async () => {
      const mockResult = {
        items: [
          { id: '2', name: 'Product B', price: 200 },
          { id: '1', name: 'Product A', price: 100 },
        ],
        total: 2,
      };

      (productService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.getProducts({
        page: 1,
        limit: 10,
        sortBy: AdminProductSortBy.PRICE,
        sortOrder: SortOrder.DESC,
      });

      expect(productService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: AdminProductSortBy.PRICE,
        sortOrder: SortOrder.DESC,
      });
    });

    it('should use default sorting when not specified', async () => {
      const mockResult = {
        items: [
          { id: '1', name: 'Product A', price: 100 },
          { id: '2', name: 'Product B', price: 200 },
        ],
        total: 2,
      };

      (productService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.getProducts({
        page: 1,
        limit: 10,
      });

      expect(productService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        category: undefined,
        sellerId: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });
  });
});

