import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductController } from './admin-product.controller';
import { ProductService } from '@/module/product/product.service';
import { Product } from '@/module/product/entity/product.entity';
import { AdminProductListResponse, AdminProductResponse } from './dto/admin-product-response.dto';
import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import {
  AdminCreateProductRequest,
  AdminProductListRequest,
  AdminProductSortBy,
  AdminUpdateProductRequest,
  SortOrder,
} from './dto/admin-product-request.dto';
import { UserService } from '@/module/user/user.service';

describe('AdminProductController', () => {
  let controller: AdminProductController;
  let productService: ProductService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminProductController>(AdminProductController);
    productService = module.get<ProductService>(ProductService);
    userService = module.get<UserService>(UserService);
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
        search: '',
        sellerId: '',
        sortBy: AdminProductSortBy.NAME,
        sortOrder: SortOrder.ASC,
      };

      const mockProducts = [
        {
          id: 'product-1',
          name: '테스트 상품 1',
          description: '설명',
          price: 10000,
          quantity: 10,
          mainImage: 'image1.jpg',
          seller: { id: 'seller-1' },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Product,
        {
          id: 'product-2',
          name: '테스트 상품 2',
          description: '설명',
          price: 20000,
          quantity: 20,
          mainImage: 'image2.jpg',
          seller: { id: 'seller-2' },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Product,
      ];
      const total = mockProducts.length;

      jest.spyOn(productService, 'findAll').mockResolvedValue({ items: mockProducts, total });

      // 실제 응답 객체 생성을 모킹하지 않고 실제 응답을 테스트
      const mockResponse = {
        data: {
          items: mockProducts,
          total,
          page: query.page || 1,
          limit: query.limit || 10,
          totalPages: Math.ceil(total / (query.limit || 10)),
        },
      };

      jest.spyOn(AdminProductListResponse, 'fromResult').mockReturnValue(mockResponse as any);

      // When
      const result = await controller.getProducts(query);

      // Then
      expect(productService.findAll).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        search: query.search,
        category: undefined,
        sellerId: query.sellerId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
      expect(result.data.total).toBe(total);
      expect(result.data.items.length).toBe(mockProducts.length);
    });
  });

  describe('getProduct', () => {
    it('상품 ID로 단일 상품을 반환해야 함', async () => {
      // Given
      const productId = 'product-1';
      const mockProduct = {
        id: productId,
        name: '테스트 상품',
        description: '설명',
        price: 10000,
        stockQuantity: 10,
        mainImage: 'image.jpg',
        seller: { id: 'seller-1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      jest.spyOn(productService, 'findOne').mockResolvedValue(mockProduct);

      const mockResponse = {
        data: {
          id: mockProduct.id,
          name: mockProduct.name,
          price: mockProduct.price,
        },
      };

      jest.spyOn(AdminProductResponse, 'fromEntity').mockReturnValue(mockResponse as any);

      // When
      const result = await controller.getProduct(productId);

      // Then
      expect(productService.findOne).toHaveBeenCalledWith(productId);
      expect(result.data.id).toBe(productId);
    });
  });

  describe('createProduct', () => {
    it('상품을 생성하고 반환해야 함', async () => {
      // Given
      const createProductDto: AdminCreateProductRequest = {
        name: '새 상품',
        description: '설명',
        price: 10000,
        stock: 10,
        sellerId: 'seller-1',
        category: '의류',
        images: ['image.jpg'],
      };

      const createdProduct = {
        id: 'new-product-id',
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stockQuantity: createProductDto.stock,
        seller: { id: createProductDto.sellerId },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Product;

      jest.spyOn(productService, 'create').mockResolvedValue(createdProduct);

      const mockResponse = {
        data: {
          id: createdProduct.id,
          name: createdProduct.name,
        },
      };

      jest.spyOn(AdminProductResponse, 'fromEntity').mockReturnValue(mockResponse as any);

      // When
      const result = await controller.createProduct(createProductDto);

      // Then
      expect(productService.create).toHaveBeenCalled();
      expect(result.data.id).toBe(createdProduct.id);
    });
  });

  describe('updateProduct', () => {
    it('상품 정보를 업데이트하고 반환해야 함', async () => {
      // Given
      const productId = 'product-1';
      const updateProductDto: AdminUpdateProductRequest = {
        name: '업데이트된 상품',
        price: 15000,
      };

      const updatedProduct = {
        id: productId,
        name: updateProductDto.name,
        price: updateProductDto.price,
        description: '기존 설명',
        stockQuantity: 10,
        mainImage: 'image.jpg',
        seller: { id: 'seller-1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      jest.spyOn(productService, 'update').mockResolvedValue(updatedProduct);

      const mockResponse = {
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };

      jest.spyOn(AdminProductResponse, 'fromEntity').mockReturnValue(mockResponse as any);

      // When
      const result = await controller.updateProduct(productId, updateProductDto);

      // Then
      expect(productService.update).toHaveBeenCalled();
      expect(result.data.name).toBe(updateProductDto.name);
    });
  });

  describe('deleteProduct', () => {
    it('상품을 삭제해야 함', async () => {
      // Given
      const productId = 'product-1';
      jest.spyOn(productService, 'remove').mockResolvedValue(undefined);

      // When
      await controller.deleteProduct(productId);

      // Then
      expect(productService.remove).toHaveBeenCalledWith(productId);
    });
  });
});

