import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { EntityRepository, Collection } from '@mikro-orm/core'; // Added Collection

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
  transactional: jest.fn().mockImplementation(async (fn) => fn(mockEntityManager)),
  findOne: jest.fn(),
  persist: jest.fn(),
  // flush: jest.fn(), // transactional이 flush를 처리하므로 모킹된 em에서 직접 호출될 필요 없음
};

const mockAgoraService = {
  rtcToken: jest.fn(),
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
      mockEntityManager.findOne.mockResolvedValueOnce(mockSeller);
      mockProductRepository.find.mockResolvedValueOnce(mockProductsData.map((p) => ({ ...p }) as Product));

      const originalPersist = mockEntityManager.persist;
      mockEntityManager.persist = jest.fn().mockImplementation((entity) => {
        if (entity instanceof Broadcast) {
          // Ensure `products` is a Collection instance before spying
          if (!(entity.products instanceof Collection)) {
            entity.products = new Collection<BroadcastProduct>(entity);
          }
          const mockBroadcastProducts = mockProductsData.map((pData) => {
            const bp = new BroadcastProduct();
            bp.product = { id: pData.id, name: pData.name } as Product;
            bp.broadcast = entity; // Link back to the broadcast
            return bp;
          });
          jest.spyOn(entity.products, 'getItems').mockReturnValue(mockBroadcastProducts);
        }
        // Call the original persist logic or a simple pass-through mock
        return originalPersist ? originalPersist(entity) : undefined;
      });

      const result = await service.createBroadcast(dto, sellerId);

      expect(mockEntityManager.transactional).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, { id: sellerId });
      expect(mockProductRepository.find).toHaveBeenCalledWith({ id: { $in: dto.productIds } });
      expect(mockEntityManager.persist).toHaveBeenCalledTimes(1 + mockProductsData.length);

      expect(result).toBeInstanceOf(BroadcastListItemDto);
      expect(result.title).toBe(dto.title);
      expect(result.thumbnailUrl).toBe(dto.thumbnailImageUrl);
      expect(result.status).toBe('SCHEDULED');
      expect(result.products.length).toBe(mockProductsData.length);
      result.products.forEach((p, index) => {
        expect(p.id).toBe(mockProductsData[index].id);
        expect(p.name).toBe(mockProductsData[index].name);
      });
      mockEntityManager.persist = originalPersist;
    });

    it('should throw NotFoundException if seller not found', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null);
      await expect(service.createBroadcast(dto, sellerId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if some products not found', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(mockSeller);
      mockProductRepository.find.mockResolvedValueOnce([{ ...mockProductsData[0] } as Product]);
      await expect(service.createBroadcast(dto, sellerId)).rejects.toThrow(BadRequestException);
    });
  });
});

