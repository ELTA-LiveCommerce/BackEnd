import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseRepository } from '@/shared/common/base.repository';
import { EntityRepository } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { mock, MockProxy } from 'jest-mock-extended';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Loaded } from '@mikro-orm/core';

import { ProductService } from './product.service';
import { Product } from './entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: MockProxy<BaseRepository<Product>>;
  let userRepository: MockProxy<EntityRepository<User>>;
  let entityManager: MockProxy<EntityManager>;
  let userService: MockProxy<UserService>;

  beforeEach(async () => {
    productRepository = mock<BaseRepository<Product>>();
    userRepository = mock<EntityRepository<User>>();
    entityManager = mock<EntityManager>();
    userService = mock<UserService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: EntityManager,
          useValue: entityManager,
        },
        {
          provide: UserService,
          useValue: userService,
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

      entityManager.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(createProductDto, seller);

      expect(result).toMatchObject({
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stockQuantity: createProductDto.stockQuantity,
        mainImage: createProductDto.mainImage,
        seller: seller,
      });
      expect(entityManager.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 'product-1', name: '스마트폰' },
        { id: 'product-2', name: '노트북' },
      ] as Product[];
      productRepository.findAll.mockResolvedValue(mockProducts as any);

      const result = await service.findAll();

      expect(result).toEqual(mockProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({ populate: ['seller'] });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const productId = 'product-1';
      const mockProduct = { id: productId, name: '스마트폰' } as Product;

      productRepository.findOne.mockResolvedValue(mockProduct as any);

      const result = await service.findOne(productId);

      expect(result).toEqual(mockProduct);
      expect(productRepository.findOne).toHaveBeenCalledWith({ id: productId }, { populate: ['seller'] });
    });

    it('should throw NotFoundException when product is not found', async () => {
      const productId = 'non-existent-product';

      productRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
      expect(productRepository.findOne).toHaveBeenCalledWith({ id: productId }, { populate: ['seller'] });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = 'product-1';
      const updateProductDto: UpdateProductDto = {
        name: '업데이트된 스마트폰',
        price: 1200000,
        stockQuantity: 40,
      };

      const existingProduct = new Product();
      existingProduct.id = productId;
      existingProduct.name = '기존 스마트폰';
      existingProduct.price = 1000000;
      existingProduct.stockQuantity = 50;
      existingProduct.seller = { id: 'seller-1' } as User;

      productRepository.findOne.mockResolvedValue(existingProduct as any);
      entityManager.flush.mockResolvedValue(undefined);

      const result = await service.update(productId, updateProductDto);

      expect(result.name).toEqual(updateProductDto.name);
      expect(result.price).toEqual(updateProductDto.price);
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product to update is not found', async () => {
      const productId = 'non-existent-product';
      const updateProductDto: UpdateProductDto = { name: '업데이트 시도' };

      productRepository.findOne.mockResolvedValue(null);

      await expect(service.update(productId, updateProductDto)).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if seller tries to update another seller's product", async () => {
      const productId = 'product-1';
      const updateProductDto: UpdateProductDto = { name: '업데이트 시도' };
      const seller = { id: 'seller-1' } as User;
      const anotherSeller = { id: 'seller-2' } as User;
      const existingProduct = { id: productId, name: 'Product 1', seller: anotherSeller } as Product;

      productRepository.findOne.mockResolvedValue(existingProduct as any);

      await expect(service.update(productId, updateProductDto, seller)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = 'product-1';
      const mockProduct = { id: productId, name: '삭제될 스마트폰' } as Product;

      productRepository.findOne.mockResolvedValue(mockProduct as any);
      entityManager.removeAndFlush.mockResolvedValue(undefined);

      await service.remove(productId);

      expect(entityManager.removeAndFlush).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException if product to remove is not found', async () => {
      const productId = 'non-existent-product';
      productRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(productId)).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if seller tries to remove another seller's product", async () => {
      const productId = 'product-1';
      const seller = { id: 'seller-1' } as User;
      const anotherSeller = { id: 'seller-2' } as User;
      const existingProduct = { id: productId, name: 'Product 1', seller: anotherSeller } as Product;

      productRepository.findOne.mockResolvedValue(existingProduct as any);

      await expect(service.remove(productId, seller)).rejects.toThrow(ForbiddenException);
      expect(productRepository.findOne).toHaveBeenCalledWith({ id: productId }, { populate: ['seller'] });
      expect(entityManager.removeAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('findProductsBySeller', () => {
    it('should return products for a given sellerId', async () => {
      const sellerId = 'seller-id-123';
      const mockProducts = [{ id: 'product-1', name: '셀러 상품' }] as Product[];
      userService.findOne.mockResolvedValue({ id: sellerId } as User);
      productRepository.find.mockResolvedValue(mockProducts as any);

      const result = await service.findProductsBySeller(sellerId);

      expect(userService.findOne).toHaveBeenCalledWith(sellerId);
      expect(productRepository.find).toHaveBeenCalledWith({ seller: { id: sellerId } }, { populate: ['seller'] });
      expect(result).toEqual(mockProducts);
    });

    it('should throw NotFoundException if seller is not found', async () => {
      const sellerId = 'non-existent-seller';
      userService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.findProductsBySeller(sellerId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('setProductDiscount', () => {
    it('should set discount price for a product', async () => {
      const productId = 'product-1';
      const discountPrice = 8000;
      const seller = { id: 'seller-1' } as User;
      const existingProduct = {
        id: productId,
        name: 'Product 1',
        price: 10000,
        seller: seller,
      } as Product;

      productRepository.findOne.mockResolvedValue(existingProduct as any);
      entityManager.flush.mockResolvedValue(undefined);

      const result = await service.setProductDiscount(productId, discountPrice, seller);

      expect(result.discountPrice).toEqual(discountPrice);
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if discount price is higher than original price', async () => {
      const productId = 'product-1';
      const discountPrice = 12000;
      const seller = { id: 'seller-1' } as User;
      const existingProduct = {
        id: productId,
        name: 'Product 1',
        price: 10000,
        seller: seller,
      } as Product;

      productRepository.findOne.mockResolvedValue(existingProduct as any);

      await expect(service.setProductDiscount(productId, discountPrice, seller)).rejects.toThrow(ForbiddenException);
      expect(entityManager.flush).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException if seller tries to discount another seller's product", async () => {
      const productId = 'product-1';
      const discountPrice = 8000;
      const seller = { id: 'seller-1' } as User;
      const anotherSeller = { id: 'seller-2' } as User;
      const existingProduct = {
        id: productId,
        name: 'Product 1',
        price: 10000,
        seller: anotherSeller,
      } as Product;

      productRepository.findOne.mockResolvedValue(existingProduct as any);

      await expect(service.setProductDiscount(productId, discountPrice, seller)).rejects.toThrow(ForbiddenException);
      expect(entityManager.flush).not.toHaveBeenCalled();
    });
  });

  describe('removeProductDiscount', () => {
    it('should remove discount price from a product', async () => {
      const productId = 'product-1';
      const seller = { id: 'seller-1' } as User;
      const existingProduct = {
        id: productId,
        name: 'Product 1',
        price: 10000,
        discountPrice: 8000,
        seller: seller,
      } as Product;

      productRepository.findOne.mockResolvedValue(existingProduct as any);
      entityManager.flush.mockResolvedValue(undefined);

      const result = await service.removeProductDiscount(productId, seller);

      expect(result.discountPrice).toBeUndefined();
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it("should throw ForbiddenException if seller tries to remove discount from another seller's product", async () => {
      const productId = 'product-1';
      const seller = { id: 'seller-1' } as User;
      const anotherSeller = { id: 'seller-2' } as User;
      const existingProduct = {
        id: productId,
        name: 'Product 1',
        price: 10000,
        discountPrice: 8000,
        seller: anotherSeller,
      } as Product;

      productRepository.findOne.mockResolvedValue(existingProduct as any);

      await expect(service.removeProductDiscount(productId, seller)).rejects.toThrow(ForbiddenException);
      expect(entityManager.flush).not.toHaveBeenCalled();
    });
  });
});
