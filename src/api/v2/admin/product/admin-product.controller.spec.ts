import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductController } from './admin-product.controller';
import { ProductService } from '@/module/product/product.service';
import {
  AdminProductListRequest,
  AdminCreateProductRequest,
  AdminUpdateProductRequest,
} from './dto/admin-product-request.dto';
import { AdminProductResponse, AdminProductListResponse } from './dto/admin-product-response.dto';

describe('AdminProductController', () => {
  let controller: AdminProductController;
  let productService: ProductService;

  const mockProductService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockProduct = {
    id: 'test-product-id',
    name: '테스트 상품',
    description: '테스트 상품입니다.',
    price: 10000,
    discountPrice: 9000,
    seller: { id: 'seller-id' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<AdminProductController>(AdminProductController);
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('상품 목록을 반환해야 함', async () => {
      // Given
      const query: AdminProductListRequest = {
        page: 1,
        limit: 10,
        search: 'test',
        category: 'category',
        sellerId: 'seller-id',
      };

      const products = [mockProduct];
      const total = 1;

      mockProductService.findAll.mockResolvedValue({
        items: products,
        total,
      });

      // When
      const result = await controller.getProducts(query);

      // Then
      expect(productService.findAll).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        search: query.search,
        category: query.category,
        sellerId: query.sellerId,
      });
      expect(result).toBeInstanceOf(AdminProductListResponse);
      expect(result.data.total).toBe(total);
      expect(result.data.items.length).toBe(products.length);
    });
  });

  describe('getProduct', () => {
    it('상품 ID로 단일 상품을 반환해야 함', async () => {
      // Given
      const productId = 'test-product-id';
      mockProductService.findOne.mockResolvedValue(mockProduct);

      // When
      const result = await controller.getProduct(productId);

      // Then
      expect(productService.findOne).toHaveBeenCalledWith(productId);
      expect(result).toBeInstanceOf(AdminProductResponse);
      expect(result.data.id).toBe(mockProduct.id);
    });
  });

  describe('createProduct', () => {
    it('상품을 생성하고 반환해야 함', async () => {
      // Given
      const createProductDto: AdminCreateProductRequest = {
        name: '테스트 상품',
        description: '테스트 상품입니다.',
        sellerId: 'seller-id',
        price: 10000,
        stock: 100,
        category: '의류',
        images: ['image1.jpg', 'image2.jpg'],
      };

      mockProductService.create.mockResolvedValue(mockProduct);

      // When
      const result = await controller.createProduct(createProductDto);

      // Then
      expect(productService.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toBeInstanceOf(AdminProductResponse);
      expect(result.data.id).toBe(mockProduct.id);
    });
  });

  describe('updateProduct', () => {
    it('상품 정보를 업데이트하고 반환해야 함', async () => {
      // Given
      const productId = 'test-product-id';
      const updateProductDto: AdminUpdateProductRequest = {
        name: '업데이트된 상품',
        price: 15000,
      };

      const updatedProduct = { ...mockProduct, name: '업데이트된 상품', price: 15000 };
      mockProductService.update.mockResolvedValue(updatedProduct);

      // When
      const result = await controller.updateProduct(productId, updateProductDto);

      // Then
      expect(productService.update).toHaveBeenCalledWith(productId, updateProductDto);
      expect(result).toBeInstanceOf(AdminProductResponse);
      expect(result.data.name).toBe(updatedProduct.name);
      expect(result.data.price).toBe(updatedProduct.price);
    });
  });

  describe('deleteProduct', () => {
    it('상품을 삭제해야 함', async () => {
      // Given
      const productId = 'test-product-id';
      mockProductService.remove.mockResolvedValue(undefined);

      // When
      await controller.deleteProduct(productId);

      // Then
      expect(productService.remove).toHaveBeenCalledWith(productId);
    });
  });
});
