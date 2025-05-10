import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('ProductService', () => {
  let service: ProductService;
  let mockProductRepository: any;
  let mockEntityManager: any;
  let mockUserService: any;

  beforeEach(async () => {
    mockProductRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    mockUserService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: UserService,
          useValue: mockUserService,
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
        mainImage: 'http://example.com/image.jpg',
        images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
      };

      const seller = new User();
      seller.id = 'user-1';
      seller.name = '판매자';
      seller.role = UserRole.SELLER;

      const product = new Product();
      Object.assign(product, createProductDto);
      product.seller = seller;

      mockEntityManager.persistAndFlush.mockImplementation(async (p) => p);

      const result = await service.create(createProductDto, seller);

      expect(result).toMatchObject({
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stockQuantity: createProductDto.stockQuantity,
        mainImage: createProductDto.mainImage,
        seller: seller,
      });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
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
      expect(mockProductRepository.findAll).toHaveBeenCalledWith({ populate: ['seller'] });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const productId = 'product-1';
      const mockProduct = { id: productId, name: '스마트폰' };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId }, { populate: ['seller'] });
    });

    it('should throw NotFoundException when product is not found', async () => {
      const productId = 'non-existent-product';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId }, { populate: ['seller'] });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = 'product-1';
      const updateProductDto: UpdateProductDto = {
        name: '업데이트된 스마트폰',
        price: 1200000,
      };

      const existingProduct = new Product();
      existingProduct.id = productId;
      existingProduct.name = '기존 스마트폰';
      existingProduct.price = 1000000;
      existingProduct.stockQuantity = 50;

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await service.update(productId, updateProductDto);

      expect(result.name).toEqual(updateProductDto.name);
      expect(result.price).toEqual(updateProductDto.price);
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product to update is not found', async () => {
      const productId = 'non-existent-product';
      const updateProductDto: UpdateProductDto = { name: '업데이트 시도' };

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.update(productId, updateProductDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = 'product-1';
      const mockProduct = { id: productId, name: '삭제될 스마트폰' };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockEntityManager.removeAndFlush.mockResolvedValue(undefined);

      await service.remove(productId);

      expect(mockEntityManager.removeAndFlush).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException if product to remove is not found', async () => {
      const productId = 'non-existent-product';
      mockProductRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(productId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findProductsBySeller', () => {
    it('should return products for a given sellerId', async () => {
      const sellerId = 'seller-id-123';
      const mockProducts = [{ id: 'product-1', name: '셀러 상품' }];
      mockUserService.findOne.mockResolvedValue({ id: sellerId }); // 판매자 존재 확인 모킹
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findProductsBySeller(sellerId);

      expect(mockUserService.findOne).toHaveBeenCalledWith(sellerId);
      expect(mockProductRepository.find).toHaveBeenCalledWith({ seller: { id: sellerId } }, { populate: ['seller'] });
      expect(result).toEqual(mockProducts);
    });

    it('should throw NotFoundException if seller is not found', async () => {
      const sellerId = 'non-existent-seller';
      mockUserService.findOne.mockRejectedValue(new NotFoundException()); // 판매자 없음 모킹

      await expect(service.findProductsBySeller(sellerId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('setProductDiscount', () => {
    it('should set discount price for a product', async () => {
      const productId = 'product-1';
      const discountPrice = 800000;

      const seller = { id: 'seller-1' } as User;
      const product = {
        id: productId,
        name: '스마트폰',
        price: 1000000,
        seller: seller,
      } as unknown as Product;

      mockProductRepository.findOne.mockResolvedValue(product);
      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await service.setProductDiscount(productId, discountPrice, seller);

      expect(result.discountPrice).toEqual(discountPrice);
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if discount price is higher than original price', async () => {
      const productId = 'product-1';
      const discountPrice = 1200000; // 원래 가격 1000000보다 높음

      const seller = { id: 'seller-1' } as User;
      const product = {
        id: productId,
        name: '스마트폰',
        price: 1000000,
        seller: seller,
      } as unknown as Product;

      mockProductRepository.findOne.mockResolvedValue(product);

      await expect(service.setProductDiscount(productId, discountPrice, seller)).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if seller tries to discount another seller's product", async () => {
      const productId = 'product-1';
      const discountPrice = 800000;

      const productSeller = { id: 'seller-1' } as User;
      const otherSeller = { id: 'seller-2' } as User;
      const product = {
        id: productId,
        name: '스마트폰',
        price: 1000000,
        seller: productSeller,
      } as unknown as Product;

      mockProductRepository.findOne.mockResolvedValue(product);

      await expect(service.setProductDiscount(productId, discountPrice, otherSeller)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('removeProductDiscount', () => {
    it('should remove discount price from a product', async () => {
      const productId = 'product-1';

      const seller = { id: 'seller-1' } as User;
      const product = {
        id: productId,
        name: '스마트폰',
        price: 1000000,
        discountPrice: 800000,
        seller: seller,
      } as unknown as Product;

      mockProductRepository.findOne.mockResolvedValue(product);
      mockEntityManager.flush.mockResolvedValue(undefined);

      const result = await service.removeProductDiscount(productId, seller);

      expect(result.discountPrice).toBeUndefined();
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it("should throw ForbiddenException if seller tries to remove discount from another seller's product", async () => {
      const productId = 'product-1';

      const productSeller = { id: 'seller-1' } as User;
      const otherSeller = { id: 'seller-2' } as User;
      const product = {
        id: productId,
        name: '스마트폰',
        price: 1000000,
        discountPrice: 800000,
        seller: productSeller,
      } as unknown as Product;

      mockProductRepository.findOne.mockResolvedValue(product);

      await expect(service.removeProductDiscount(productId, otherSeller)).rejects.toThrow(ForbiddenException);
    });
  });
});
