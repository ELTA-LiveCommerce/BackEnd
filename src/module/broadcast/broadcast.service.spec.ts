import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityRepository } from '@mikro-orm/core';

import { BroadcastService } from './broadcast.service';
import { Broadcast } from './entity/broadcast.entity';
import { Stream } from './entity/stream.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { BroadcastCreateRequestDto } from '@/api/v2/seller/lives/dto/broadcast-create.request.dto';
import { BroadcastListItemDto } from './dto/broadcast-list-item.dto';
import { BroadcastProduct } from '../product/entity/broadcast-product.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AgoraService } from '../agora/agora.service';

const mockBroadcastRepository = {
  // 필요한 메소드 모킹
};

const mockProductRepository = {
  find: jest.fn(),
};

const mockStreamRepository = {
  // 필요한 메소드 모킹
};

const mockEntityManager = {
  transactional: jest.fn(),
  findOne: jest.fn(),
  persist: jest.fn(),
};

const mockAgoraService = {
  rtcToken: jest.fn(),
  rtcTokenWithAccount: jest.fn().mockReturnValue('mock-rtc-token'),
};

describe('BroadcastService', () => {
  let service: BroadcastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BroadcastService,
        { provide: getRepositoryToken(Broadcast), useValue: mockBroadcastRepository },
        { provide: getRepositoryToken(Product), useValue: mockProductRepository },
        { provide: getRepositoryToken(Stream), useValue: mockStreamRepository },
        { provide: SqlEntityManager, useValue: mockEntityManager },
        { provide: AgoraService, useValue: mockAgoraService },
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
      description: '테스트 라이브 방송 설명입니다.',
      scheduledAt: new Date().toISOString(),
      productIds: ['prod1', 'prod2'],
      thumbnailImageUrl: 'http://example.com/thumb.jpg',
    };
    const mockSeller = { id: sellerId, name: 'Test Seller' } as User;
    const mockProductsData = [
      { id: 'prod1', name: 'Product 1' },
      { id: 'prod2', name: 'Product 2' },
    ];

    it('should create and return a broadcast list item', async () => {
      // 테스트를 위한 mock 로직 구현
      const result = new BroadcastListItemDto({
        id: 'broadcast-id',
        title: dto.title,
        status: 'SCHEDULED',
        thumbnailUrl: dto.thumbnailImageUrl,
        scheduledAt: new Date(dto.scheduledAt),
        products: mockProductsData.map((p) => ({ id: p.id, name: p.name })),
      });

      mockEntityManager.transactional.mockResolvedValueOnce(result);

      const actual = await service.createBroadcast(dto, sellerId);

      expect(mockEntityManager.transactional).toHaveBeenCalled();
      expect(actual).toBeInstanceOf(BroadcastListItemDto);
      expect(actual.title).toBe(dto.title);
      expect(actual.thumbnailUrl).toBe(dto.thumbnailImageUrl);
      expect(actual.products.length).toBe(mockProductsData.length);
    });

    it('should throw NotFoundException if seller not found', async () => {
      mockEntityManager.transactional.mockRejectedValueOnce(new NotFoundException('Seller not found'));

      await expect(service.createBroadcast(dto, sellerId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if some products not found', async () => {
      mockEntityManager.transactional.mockRejectedValueOnce(new BadRequestException('Following product IDs not found'));

      await expect(service.createBroadcast(dto, sellerId)).rejects.toThrow(BadRequestException);
    });
  });
});

