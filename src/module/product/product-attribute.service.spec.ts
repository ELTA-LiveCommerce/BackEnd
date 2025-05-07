import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateProductAttributeDto, UpdateProductAttributeDto } from './dto/product-attribute.dto';
import { ProductAttribute } from './entity/product-attribute.entity';
import { Product } from './entity/product.entity';
import { ProductAttributeService } from './product-attribute.service';

describe('ProductAttributeService', () => {
  let service: ProductAttributeService;
  let mockAttributeRepository: any;
  let mockProductRepository: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockAttributeRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockProductRepository = {
      findOne: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductAttributeService,
        {
          provide: getRepositoryToken(ProductAttribute),
          useValue: mockAttributeRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<ProductAttributeService>(ProductAttributeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product attribute', async () => {
      const productId = 'product-1';
      const createDto: CreateProductAttributeDto = {
        name: '모델명',
        value: 'Galaxy S23',
        sortOrder: 1,
        isVisible: true,
      };

      const mockProduct = {
        id: productId,
        name: '스마트폰',
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.create(createDto, productId);

      expect(result).toEqual(
        expect.objectContaining({
          name: createDto.name,
          value: createDto.value,
          sortOrder: createDto.sortOrder,
          isVisible: createDto.isVisible,
          product: mockProduct,
        }),
      );
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const productId = 'non-existent-product';
      const createDto: CreateProductAttributeDto = {
        name: '모델명',
        value: 'Galaxy S23',
      };

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, productId)).rejects.toThrow(NotFoundException);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId });
      expect(mockEntityManager.persistAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('findByProductId', () => {
    it('should return all attributes for a product', async () => {
      const productId = 'product-1';
      const mockProduct = { id: productId, name: '스마트폰' };
      const mockAttributes = [
        { id: 'attr-1', name: '모델명', value: 'Galaxy S23', product: mockProduct },
        { id: 'attr-2', name: '브랜드', value: 'Samsung', product: mockProduct },
      ];

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockAttributeRepository.find.mockResolvedValue(mockAttributes);

      const result = await service.findByProductId(productId);

      expect(result).toEqual(mockAttributes);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId });
      expect(mockAttributeRepository.find).toHaveBeenCalledWith(
        { product: mockProduct },
        { orderBy: { sortOrder: 'ASC' } },
      );
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const productId = 'non-existent-product';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findByProductId(productId)).rejects.toThrow(NotFoundException);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId });
      expect(mockAttributeRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an attribute by id', async () => {
      const attributeId = 'attr-1';
      const mockAttribute = {
        id: attributeId,
        name: '모델명',
        value: 'Galaxy S23',
        product: { id: 'product-1' },
      };

      mockAttributeRepository.findOne.mockResolvedValue(mockAttribute);

      const result = await service.findOne(attributeId);

      expect(result).toEqual(mockAttribute);
      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({ id: attributeId }, { populate: ['product'] });
    });

    it('should throw NotFoundException when attribute does not exist', async () => {
      const attributeId = 'non-existent-attribute';

      mockAttributeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(attributeId)).rejects.toThrow(NotFoundException);
      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({ id: attributeId }, { populate: ['product'] });
    });
  });

  describe('update', () => {
    it('should update an attribute', async () => {
      const attributeId = 'attr-1';
      const updateDto: UpdateProductAttributeDto = {
        value: '새 모델명',
        isVisible: false,
      };

      const mockAttribute = {
        id: attributeId,
        name: '모델명',
        value: 'Galaxy S23',
        sortOrder: 1,
        isVisible: true,
        product: { id: 'product-1' },
      };

      mockAttributeRepository.findOne.mockResolvedValue(mockAttribute);

      const result = await service.update(attributeId, updateDto);

      expect(result.value).toEqual(updateDto.value);
      expect(result.isVisible).toEqual(updateDto.isVisible);
      expect(result.name).toEqual(mockAttribute.name); // name should not change
      expect(result.sortOrder).toEqual(mockAttribute.sortOrder); // sortOrder should not change
      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({ id: attributeId }, { populate: ['product'] });
      expect(mockEntityManager.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when attribute does not exist', async () => {
      const attributeId = 'non-existent-attribute';
      const updateDto: UpdateProductAttributeDto = {
        value: '새 모델명',
      };

      mockAttributeRepository.findOne.mockResolvedValue(null);

      await expect(service.update(attributeId, updateDto)).rejects.toThrow(NotFoundException);
      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({ id: attributeId }, { populate: ['product'] });
      expect(mockEntityManager.flush).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an attribute', async () => {
      const attributeId = 'attr-1';
      const mockAttribute = {
        id: attributeId,
        name: '모델명',
        value: 'Galaxy S23',
        product: { id: 'product-1' },
      };

      mockAttributeRepository.findOne.mockResolvedValue(mockAttribute);

      await service.remove(attributeId);

      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({ id: attributeId }, { populate: ['product'] });
      expect(mockEntityManager.removeAndFlush).toHaveBeenCalledWith(mockAttribute);
    });

    it('should throw NotFoundException when attribute does not exist', async () => {
      const attributeId = 'non-existent-attribute';

      mockAttributeRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(attributeId)).rejects.toThrow(NotFoundException);
      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({ id: attributeId }, { populate: ['product'] });
      expect(mockEntityManager.removeAndFlush).not.toHaveBeenCalled();
    });
  });

  describe('createBulk', () => {
    it('should create multiple attributes for a product', async () => {
      const productId = 'product-1';
      const createDtos: CreateProductAttributeDto[] = [
        { name: '모델명', value: 'Galaxy S23' },
        { name: '브랜드', value: 'Samsung' },
        { name: '제조사', value: '삼성전자' },
      ];

      const mockProduct = { id: productId, name: '스마트폰' };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.createBulk(productId, createDtos);

      expect(result.length).toBe(createDtos.length);
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: createDtos[0].name,
          value: createDtos[0].value,
          product: mockProduct,
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          name: createDtos[1].name,
          value: createDtos[1].value,
          product: mockProduct,
        }),
      );
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const productId = 'non-existent-product';
      const createDtos: CreateProductAttributeDto[] = [
        { name: '모델명', value: 'Galaxy S23' },
        { name: '브랜드', value: 'Samsung' },
      ];

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.createBulk(productId, createDtos)).rejects.toThrow(NotFoundException);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: productId });
      expect(mockEntityManager.persistAndFlush).not.toHaveBeenCalled();
    });
  });
});
