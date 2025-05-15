import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { BroadcastService } from './broadcast.service';
import { Broadcast } from './entity/broadcast.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { BroadcastCreateRequestDto } from '@/api/v2/seller/lives/dto/broadcast-create.request.dto';
import { BroadcastListItemDto } from './dto/broadcast-list-item.dto';
import { BroadcastProduct } from '../product/entity/broadcast-product.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockBroadcastRepository = {
  // 필요한 메소드 모킹
};

const mockProductRepository = {
  find: jest.fn(),
};

const mockEntityManager = {
  transactional: jest.fn().mockImplementation(async (fn) => fn(mockEntityManager)), // transactional 내부에서 em을 사용하므로 모킹된 em을 다시 전달
  findOne: jest.fn(),
  persist: jest.fn(),
  // flush: jest.fn(), // transactional이 flush를 처리
};

describe('BroadcastService', () => {
  let service: BroadcastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BroadcastService,
        { provide: getRepositoryToken(Broadcast), useValue: mockBroadcastRepository },
        { provide: getRepositoryToken(Product), useValue: mockProductRepository },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();

    service = module.get<BroadcastService>(BroadcastService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBroadcast', () => {
    const sellerId = 'test-seller-id';
    const dto: BroadcastCreateRequestDto = {
      title: 'Test Live',
      scheduledAt: new Date().toISOString(),
      productIds: ['prod1', 'prod2'],
      thumbnailImageUrl: 'http://example.com/thumb.jpg',
    };
    const mockSeller = { id: sellerId, name: 'Test Seller' } as User;
    const mockProducts = [
      { id: 'prod1', name: 'Product 1' },
      { id: 'prod2', name: 'Product 2' },
    ] as Product[];

    it('should create and return a broadcast list item', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(mockSeller); // For seller
      mockProductRepository.find.mockResolvedValueOnce(mockProducts);
      // transactional 내부에서 persist가 Broadcast 및 BroadcastProduct에 대해 호출됨
      // 반환되는 BroadcastListItemDto 검증

      const result = await service.createBroadcast(dto, sellerId);

      expect(mockEntityManager.transactional).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, { id: sellerId });
      expect(mockProductRepository.find).toHaveBeenCalledWith({ id: { $in: dto.productIds } });
      expect(mockEntityManager.persist).toHaveBeenCalledTimes(1 + mockProducts.length); // Broadcast + 각 BroadcastProduct

      expect(result).toBeInstanceOf(BroadcastListItemDto);
      expect(result.title).toBe(dto.title);
      expect(result.thumbnailUrl).toBe(dto.thumbnailImageUrl);
      expect(result.status).toBe('SCHEDULED');
      expect(result.products.length).toBe(mockProducts.length);
      result.products.forEach((p, index) => {
        expect(p.id).toBe(mockProducts[index].id);
        expect(p.name).toBe(mockProducts[index].name);
      });
    });

    it('should throw NotFoundException if seller not found', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Seller not found

      await expect(service.createBroadcast(dto, sellerId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if some products not found', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(mockSeller);
      mockProductRepository.find.mockResolvedValueOnce([mockProducts[0]]); // Only one product found

      await expect(service.createBroadcast(dto, sellerId)).rejects.toThrow(BadRequestException);
    });
  });
});
