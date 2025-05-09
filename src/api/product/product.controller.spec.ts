import { Collection } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { ProductStatus } from '@/shared/enum/product-status.enum';
import { UserRole } from '@/shared/enum/user-role.enum';

import { ProductController } from './product.controller';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;

  const mockProductService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findProductsBySeller: jest.fn(), // 새 메서드 mock
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard) // 실제 Guard 로직 테스트 회피
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard) // 실제 Guard 로직 테스트 회피
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result: Product[] = [
        {
          id: '1',
          name: 'Test Product',
          price: 100,
          seller: { id: 'seller1' },
          description: 'Product description',
          stockQuantity: 10,
          status: ProductStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: new Collection<any>({}),
        } as unknown as Product,
      ];
      mockProductService.findAll.mockResolvedValue(result);
      expect(await controller.findAll()).toBe(result);
      expect(productService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      const productId = '1';
      const result: Product = {
        id: productId,
        name: 'Test Product',
        price: 100,
        seller: { id: 'seller1' },
        description: 'Product description',
        stockQuantity: 10,
        status: ProductStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        attributes: new Collection<any>({}),
      } as unknown as Product;
      mockProductService.findOne.mockResolvedValue(result);
      expect(await controller.findOne(productId)).toBe(result);
      expect(productService.findOne).toHaveBeenCalledWith(productId);
    });
  });

  describe('findProductsBySeller', () => {
    it('should return products for a given sellerId', async () => {
      const sellerId = 'seller-abc';
      const mockResult: Product[] = [
        {
          id: 'prod-1',
          name: 'Product A',
          seller: { id: sellerId },
          description: 'Product A description',
          price: 100,
          stockQuantity: 10,
          status: ProductStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: new Collection<any>({}),
        } as unknown as Product,
        {
          id: 'prod-2',
          name: 'Product B',
          seller: { id: sellerId },
          description: 'Product B description',
          price: 200,
          stockQuantity: 5,
          status: ProductStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          attributes: new Collection<any>({}),
        } as unknown as Product,
      ];
      mockProductService.findProductsBySeller.mockResolvedValue(mockResult);

      const products = await controller.findProductsBySeller(sellerId);

      expect(products).toEqual(mockResult);
      expect(productService.findProductsBySeller).toHaveBeenCalledWith(sellerId);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      // CreateProductDto에 sellerId가 필요하다면 추가해야 합니다. 현재 DTO 정의를 알 수 없어 가정합니다.
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        price: 200,
        stockQuantity: 10,
        description: 'desc',
      };
      const mockReq = { user: { id: 'seller1', role: UserRole.SELLER } };
      const result: Product = {
        id: '2',
        ...createProductDto,
        seller: mockReq.user as any,
        status: ProductStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        attributes: new Collection<any>({}),
      } as unknown as Product;

      mockProductService.create.mockResolvedValue(result);
      expect(await controller.create(createProductDto, mockReq)).toBe(result);
      expect(productService.create).toHaveBeenCalledWith(createProductDto, mockReq.user);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = '1';
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };
      // Product 타입에 맞게 필요한 필드 추가
      const result: Product = {
        id: productId,
        name: 'Updated Product',
        price: 100,
        seller: { id: 'seller1' } as any,
        stockQuantity: 10,
        description: 'desc',
        status: ProductStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        attributes: new Collection<any>({}),
      } as unknown as Product;

      mockProductService.update.mockResolvedValue(result);
      expect(await controller.update(productId, updateProductDto)).toBe(result);
      expect(productService.update).toHaveBeenCalledWith(productId, updateProductDto);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = '1';
      mockProductService.remove.mockResolvedValue(undefined); // remove는 void를 반환
      await controller.remove(productId);
      expect(productService.remove).toHaveBeenCalledWith(productId);
    });
  });
});
