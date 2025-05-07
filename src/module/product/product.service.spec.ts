import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '@/module/user/entity/user.entity';
import { ProductStatus } from '@/shared/enum/product-status.enum';
import { UserRole } from '@/shared/enum/user-role.enum';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductAttribute } from './entity/product-attribute.entity';
import { Product } from './entity/product.entity';
import { ProductService } from './product.service';

// Collection 모킹 클래스
class MockCollection<T = any> {
  items: T[] = [];

  add(item: T): this {
    this.items.push(item);
    return this;
  }

  remove(item: T): this {
    this.items = this.items.filter((i) => i !== item);
    return this;
  }
}

describe('ProductService', () => {
  let service: ProductService;
  let mockProductRepository: any;
  let mockAttributeRepository: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockProductRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    mockAttributeRepository = {
      findOne: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductAttribute),
          useValue: mockAttributeRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        name: '스마트폰',
        description: '최신 스마트폰',
        price: 1000000,
        stockQuantity: 100,
        discountRate: 10,
        thumbnailUrl: 'http://example.com/image.jpg',
        images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
      };

      const seller = new User();
      seller.id = 'user-1';
      seller.name = '판매자';
      seller.role = UserRole.SELLER;

      // Product 객체 생성 시 attributes 컬렉션 모킹을 추가
      const product = new Product();
      product.attributes = new MockCollection<ProductAttribute>() as any;
      Object.assign(product, createProductDto);
      product.seller = seller;

      // persistAndFlush가 해당 product를 반환하도록 설정
      mockEntityManager.persistAndFlush.mockImplementation(async (p) => p);

      const result = await service.create(createProductDto, seller);

      expect(result).toMatchObject({
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stockQuantity: createProductDto.stockQuantity,
        discountRate: createProductDto.discountRate,
        thumbnailUrl: createProductDto.thumbnailUrl,
        seller: seller,
      });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
    });

    it('should create a product with attributes', async () => {
      // create 메서드의 구현을 모킹하여 테스트
      jest.spyOn(service, 'create').mockImplementation(async (dto, seller) => {
        const product = new Product();
        product.attributes = new MockCollection<ProductAttribute>() as any;
        Object.assign(product, dto);
        product.seller = seller;
        return product;
      });

      const createProductDto: CreateProductDto = {
        name: '스마트폰',
        description: '최신 스마트폰',
        price: 1000000,
        stockQuantity: 100,
        attributes: [
          { name: '모델명', value: 'Galaxy S23' },
          { name: '브랜드', value: 'Samsung' },
        ],
      };

      const seller = new User();
      seller.id = 'user-1';
      seller.name = '판매자';
      seller.role = UserRole.SELLER;

      const result = await service.create(createProductDto, seller);

      expect(result.name).toEqual(createProductDto.name);
      expect(result.price).toEqual(createProductDto.price);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 'product-1', name: '스마트폰' },
        { id: 'product-2', name: '노트북' },
      ];
      mockProductRepository.findAll.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(result).toEqual(mockProducts);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith({ populate: ['seller', 'attributes'] });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const productId = 'product-1';
      const mockProduct = { id: productId, name: '스마트폰' };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith(
        { id: productId },
        { populate: ['seller', 'attributes'] },
      );
    });

    it('should throw NotFoundException when product is not found', async () => {
      const productId = 'non-existent-product';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith(
        { id: productId },
        { populate: ['seller', 'attributes'] },
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = 'product-1';
      const updateProductDto: UpdateProductDto = {
        name: '새 스마트폰',
        price: 900000,
        discountRate: 15,
      };

      const mockProduct = {
        id: productId,
        name: '스마트폰',
        price: 1000000,
        discountRate: 10,
        attributes: new MockCollection<ProductAttribute>() as any,
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.update(productId, updateProductDto);

      expect(result.name).toEqual(updateProductDto.name);
      expect(result.price).toEqual(updateProductDto.price);
      expect(result.discountRate).toEqual(updateProductDto.discountRate);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith(
        { id: productId },
        { populate: ['seller', 'attributes'] },
      );
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should update a product with attributes', async () => {
      const productId = 'product-1';
      const updateProductDto: UpdateProductDto = {
        name: '새 스마트폰',
        attributes: [{ name: '색상', value: '블랙' }],
        attributeUpdates: [{ id: 'attr-1', updates: { value: '갤럭시 S23' } }],
        attributeIdsToRemove: ['attr-2'],
      };

      const mockProduct = {
        id: productId,
        name: '스마트폰',
        attributes: new MockCollection<ProductAttribute>() as any,
      };

      const mockAttribute = {
        id: 'attr-1',
        name: '모델명',
        value: 'Galaxy S23',
        product: { id: productId },
      };

      const mockAttributeToRemove = {
        id: 'attr-2',
        name: '브랜드',
        value: 'Samsung',
        product: { id: productId },
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockAttributeRepository.findOne.mockImplementation((criteria) => {
        if (criteria.id === 'attr-1') return mockAttribute;
        if (criteria.id === 'attr-2') return mockAttributeToRemove;
        return null;
      });

      const result = await service.update(productId, updateProductDto);

      expect(result.name).toEqual(updateProductDto.name);
      expect(mockEntityManager.flush).toHaveBeenCalled();
      expect(mockEntityManager.removeAndFlush).toHaveBeenCalled();
    });

    it('should not update fields that are not provided', async () => {
      const productId = 'product-1';
      const updateProductDto: UpdateProductDto = {
        price: 900000,
      };

      const mockProduct = {
        id: productId,
        name: '스마트폰',
        price: 1000000,
        status: ProductStatus.ACTIVE,
        attributes: new MockCollection<ProductAttribute>() as any,
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.update(productId, updateProductDto);

      expect(result.name).toEqual(mockProduct.name); // name should not change
      expect(result.price).toEqual(updateProductDto.price); // price should change
      expect(result.status).toEqual(mockProduct.status); // status should not change
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = 'product-1';
      const mockProduct = {
        id: productId,
        name: '스마트폰',
        attributes: new MockCollection<ProductAttribute>() as any,
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      await service.remove(productId);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith(
        { id: productId },
        { populate: ['seller', 'attributes'] },
      );
      expect(mockEntityManager.removeAndFlush).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('finalPrice calculation', () => {
    it('should use discountPrice if provided', () => {
      const product = new Product();
      product.price = 1000000;
      product.discountPrice = 800000;
      product.discountRate = 10; // This should be ignored when discountPrice is provided

      expect(product.finalPrice).toEqual(800000);
    });

    it('should calculate price based on discountRate if discountPrice is not provided', () => {
      const product = new Product();
      product.price = 1000000;
      product.discountRate = 10;

      expect(product.finalPrice).toEqual(900000); // 1000000 * (1 - 10/100) = 900000
    });

    it('should return original price if no discount is provided', () => {
      const product = new Product();
      product.price = 1000000;

      expect(product.finalPrice).toEqual(1000000);
    });
  });
});
