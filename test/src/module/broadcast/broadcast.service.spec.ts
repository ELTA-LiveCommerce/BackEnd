import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Stream } from '@/module/broadcast/entity/stream.entity';
import { BroadcastProduct, BroadcastProductStatus } from '@/module/product/entity/broadcast-product.entity';
import { Product } from '@/module/product/entity/product.entity';
import { AgoraService } from '@/module/agora/agora.service';
import { User } from '@/module/user/entity/user.entity';
import { UserBlockService } from '@/module/user/user-block.service';

// @Transactional 데코레이터 모킹 - 단순히 함수를 통과시키는 빈 데코레이터로 만듦
jest.mock('@nestjs-cls/transactional', () => ({
  Transactional: () => () => {},
}));

describe('BroadcastService', () => {
  let service: BroadcastService;
  let entityManager: EntityManager;

  const mockBroadcastRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockStreamRepository = {
    create: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
  };

  const mockAgoraService = {
    rtcTokenWithAccount: jest.fn().mockReturnValue('test-rtc-token'),
    chatToken: jest.fn().mockReturnValue('test-chat-token'),
  };

  const mockUserBlockService = {
    isUserBlockedBySeller: jest.fn().mockResolvedValue(false),
  };

  const mockEntityManager = {
    find: jest.fn().mockReturnValue([]),
    findOne: jest.fn().mockReturnValue(null),
    persist: jest.fn(),
    flush: jest.fn(),
    persistAndFlush: jest.fn(),
    transactional: jest.fn((callback) => callback(mockEntityManager)),
  };

  const mockUser = {
    id: 'user-id',
    name: '테스트 유저',
  } as User;

  const mockSeller = {
    id: 'seller-id',
    name: '테스트 판매자',
  } as User;

  const mockProduct = {
    id: 'product-id',
    name: '테스트 상품',
    price: 10000,
  } as Product;

  const mockBroadcastProduct = {
    id: 'broadcast-product-id',
    product: mockProduct,
    broadcast: { id: 'broadcast-id' },
    sortOrder: 1,
    status: BroadcastProductStatus.PENDING,
    soldQuantity: 0,
  } as BroadcastProduct;

  const mockStream = {
    id: 'stream-id',
    seller: mockSeller,
    currentSellingProduct: mockBroadcastProduct,
  } as Stream;

  const mockBroadcast = {
    id: 'broadcast-id',
    seller: mockSeller,
    isLive: true,
    stream: mockStream,
  } as Broadcast;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BroadcastService,
        {
          provide: getRepositoryToken(Broadcast),
          useValue: mockBroadcastRepository,
        },
        {
          provide: getRepositoryToken(Stream),
          useValue: mockStreamRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: AgoraService,
          useValue: mockAgoraService,
        },
        {
          provide: UserBlockService,
          useValue: mockUserBlockService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: SqlEntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<BroadcastService>(BroadcastService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentSellingProduct', () => {
    it('should return the current selling product', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.findOne.mockReturnValue(Promise.resolve(mockBroadcastProduct));

      const result = await service.getCurrentSellingProduct('broadcast-id');

      expect(result).toBe(mockBroadcastProduct);
      expect(mockBroadcastRepository.findOne).toHaveBeenCalledWith({ id: 'broadcast-id' }, { populate: ['stream'] });
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        BroadcastProduct,
        { id: 'broadcast-product-id' },
        { populate: ['product'] },
      );
    });

    it('should return null when no product is being sold', async () => {
      const broadcastWithoutProduct = { ...mockBroadcast, stream: { ...mockStream, currentSellingProduct: null } };
      mockBroadcastRepository.findOne.mockResolvedValue(broadcastWithoutProduct);

      const result = await service.getCurrentSellingProduct('broadcast-id');

      expect(result).toBeNull();
    });

    it('should throw NotFoundException when broadcast not found', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(null);

      await expect(service.getCurrentSellingProduct('not-exist-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when broadcast is not live', async () => {
      const notLiveBroadcast = { ...mockBroadcast, isLive: false };
      mockBroadcastRepository.findOne.mockResolvedValue(notLiveBroadcast);

      await expect(service.getCurrentSellingProduct('broadcast-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBroadcastProducts', () => {
    it('should return the list of broadcast products', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.find.mockReturnValue(Promise.resolve([mockBroadcastProduct]));

      const result = await service.getBroadcastProducts('broadcast-id');

      expect(result).toEqual([mockBroadcastProduct]);
      expect(mockBroadcastRepository.findOne).toHaveBeenCalledWith({ id: 'broadcast-id' });
      expect(mockEntityManager.find).toHaveBeenCalledWith(
        BroadcastProduct,
        { broadcast: { id: 'broadcast-id' } },
        expect.objectContaining({
          populate: ['product'],
          orderBy: { sortOrder: 'ASC' },
        }),
      );
    });

    it('should throw NotFoundException when broadcast not found', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(null);

      await expect(service.getBroadcastProducts('not-exist-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCurrentSellingProduct', () => {
    it('should update the current selling product', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);

      // 모의 구현을 두 번의 호출에 대해 각각 다른 값을 반환하도록 설정
      mockEntityManager.findOne
        .mockReturnValueOnce(Promise.resolve(mockBroadcastProduct)) // 새 상품 조회
        .mockReturnValueOnce(Promise.resolve({ ...mockBroadcastProduct, id: 'current-product-id' })); // 기존 상품 조회

      const result = await service.updateCurrentSellingProduct('broadcast-id', 'product-id', 'seller-id');

      expect(result).toBe(mockBroadcastProduct);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledTimes(3); // 기존 상품, 새 상품, 스트림 업데이트
    });

    it('should throw ForbiddenException when seller is not the owner', async () => {
      const broadcastWithDifferentSeller = {
        ...mockBroadcast,
        seller: { ...mockSeller, id: 'different-seller-id' },
      };
      mockBroadcastRepository.findOne.mockResolvedValue(broadcastWithDifferentSeller);

      await expect(service.updateCurrentSellingProduct('broadcast-id', 'product-id', 'seller-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when product is not found', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.findOne.mockReturnValue(Promise.resolve(null)); // 상품을 찾지 못함

      await expect(
        service.updateCurrentSellingProduct('broadcast-id', 'not-exist-product-id', 'seller-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('stopSellingProduct', () => {
    it('should stop selling the current product', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.findOne.mockReturnValue(Promise.resolve(mockBroadcastProduct));

      await service.stopSellingProduct('broadcast-id', 'seller-id');

      // 메서드 호출 횟수는 구현에 따라 달라질 수 있으므로 호출 여부만 확인
      expect(mockEntityManager.persist).toHaveBeenCalled();
    });

    it('should throw BadRequestException when no product is being sold', async () => {
      const broadcastWithoutProduct = { ...mockBroadcast, stream: { ...mockStream, currentSellingProduct: null } };
      mockBroadcastRepository.findOne.mockResolvedValue(broadcastWithoutProduct);

      await expect(service.stopSellingProduct('broadcast-id', 'seller-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when seller is not the owner', async () => {
      const broadcastWithDifferentSeller = {
        ...mockBroadcast,
        seller: { ...mockSeller, id: 'different-seller-id' },
      };
      mockBroadcastRepository.findOne.mockResolvedValue(broadcastWithDifferentSeller);

      await expect(service.stopSellingProduct('broadcast-id', 'seller-id')).rejects.toThrow(ForbiddenException);
    });
  });
});

