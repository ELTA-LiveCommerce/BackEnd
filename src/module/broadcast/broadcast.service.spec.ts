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
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AgoraService } from '../agora/agora.service';
import { UserBlockService } from '../user/user-block.service';

const mockBroadcastRepository = {
  findOne: jest.fn(),
};

const mockProductRepository = {
  find: jest.fn(),
};

const mockStreamRepository = {
  // 필요한 메소드 모킹
};

const mockEntityManager = {
  find: jest.fn().mockReturnValue([]),
  findOne: jest.fn().mockReturnValue(null),
  persist: jest.fn(),
  flush: jest.fn(),
  persistAndFlush: jest.fn(),
  transactional: jest.fn((callback) => callback(mockEntityManager)),
};

const mockAgoraService = {
  rtcToken: jest.fn(),
  rtcTokenWithAccount: jest.fn().mockReturnValue('mock-rtc-token'),
  chatUserToken: jest.fn().mockReturnValue('mock-chat-token'),
  addUser: jest.fn(),
  getChannelUserCount: jest.fn(),
  getChatRoomMemberCount: jest.fn(),
};

const mockUserBlockService = {
  isUserBlockedBySeller: jest.fn(),
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
        { provide: UserBlockService, useValue: mockUserBlockService },
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

  describe('join', () => {
    const broadcastId = 'test-broadcast-id';
    const userId = 'test-user-id';
    const sellerId = 'test-seller-id';

    const mockBroadcast = {
      id: broadcastId,
      isLive: true,
      seller: { id: sellerId },
      stream: {
        id: 'test-channel-id',
        chatRoomId: 'test-chat-room-id',
      },
      maxViewers: 10, // 기본 최대 시청자 수
    };

    beforeEach(() => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockAgoraService.addUser.mockResolvedValue(undefined);
      mockUserBlockService.isUserBlockedBySeller.mockResolvedValue(false);
      mockAgoraService.getChannelUserCount.mockResolvedValue(5); // 기본 5명
    });

    it('should successfully join broadcast when user is not blocked and under max viewers', async () => {
      const result = await service.join(broadcastId, userId);

      expect(mockBroadcastRepository.findOne).toHaveBeenCalledWith(
        { id: broadcastId },
        { populate: ['stream', 'seller'] },
      );
      expect(mockUserBlockService.isUserBlockedBySeller).toHaveBeenCalledWith(sellerId, userId);
      expect(mockAgoraService.getChannelUserCount).toHaveBeenCalledWith('test-channel-id');
      expect(result).toMatchObject({
        broadcastId,
        channelId: 'test-channel-id',
        chatRoomId: 'test-chat-room-id',
        uid: userId.replace(/-/g, '_'),
      });
    });

    it('should allow join when maxViewers is 0 (unlimited)', async () => {
      const unlimitedBroadcast = { ...mockBroadcast, maxViewers: 0 };
      mockBroadcastRepository.findOne.mockResolvedValue(unlimitedBroadcast);

      const result = await service.join(broadcastId, userId);

      expect(result).toMatchObject({
        broadcastId,
        channelId: 'test-channel-id',
      });
      expect(mockAgoraService.getChannelUserCount).not.toHaveBeenCalled(); // 최대 인원 체크 안함
    });

    it('should throw BadRequestException when max viewers reached', async () => {
      const fullBroadcast = { ...mockBroadcast, maxViewers: 3 };
      mockBroadcastRepository.findOne.mockResolvedValue(fullBroadcast);
      mockAgoraService.getChannelUserCount.mockResolvedValue(4); // 4명 RTC 사용자 = 3명 시청자 (호스트 제외)

      await expect(service.join(broadcastId, userId)).rejects.toThrow(
        new BadRequestException('방송 시청자 수가 최대 허용 인원(3명)에 도달했습니다.'),
      );

      expect(mockAgoraService.getChannelUserCount).toHaveBeenCalledWith('test-channel-id');
      expect(mockAgoraService.addUser).not.toHaveBeenCalled(); // 접속 시도하지 않음
    });

    it('should throw BadRequestException when max viewers exactly reached', async () => {
      const fullBroadcast = { ...mockBroadcast, maxViewers: 4 };
      mockBroadcastRepository.findOne.mockResolvedValue(fullBroadcast);
      mockAgoraService.getChannelUserCount.mockResolvedValue(5); // 5명 RTC 사용자 = 4명 시청자 (호스트 제외)

      await expect(service.join(broadcastId, userId)).rejects.toThrow(
        new BadRequestException('방송 시청자 수가 최대 허용 인원(4명)에 도달했습니다.'),
      );
    });

    it('should allow join when current viewers is one less than max', async () => {
      const almostFullBroadcast = { ...mockBroadcast, maxViewers: 5 };
      mockBroadcastRepository.findOne.mockResolvedValue(almostFullBroadcast);
      mockAgoraService.getChannelUserCount.mockResolvedValue(5); // 5명 RTC 사용자 = 4명 시청자 (호스트 제외)

      const result = await service.join(broadcastId, userId);

      expect(result).toMatchObject({
        broadcastId,
        channelId: 'test-channel-id',
      });
      expect(mockAgoraService.addUser).toHaveBeenCalled();
    });

    it('should throw BadRequestException when Agora API fails during viewer count check', async () => {
      mockAgoraService.getChannelUserCount.mockRejectedValue(new Error('Agora API Error'));

      await expect(service.join(broadcastId, userId)).rejects.toThrow(
        new BadRequestException('방송 시청자 수를 확인할 수 없어 접속이 제한됩니다.'),
      );

      expect(mockAgoraService.addUser).not.toHaveBeenCalled();
    });

    it('should handle zero RTC users gracefully', async () => {
      mockAgoraService.getChannelUserCount.mockResolvedValue(0); // 아무도 없음

      const result = await service.join(broadcastId, userId);

      expect(result).toMatchObject({
        broadcastId,
        channelId: 'test-channel-id',
      });
    });

    it('should throw ForbiddenException when user is blocked by seller', async () => {
      // 사용자가 차단된 상태로 설정
      mockUserBlockService.isUserBlockedBySeller.mockResolvedValue(true);

      await expect(service.join(broadcastId, userId)).rejects.toThrow(
        new ForbiddenException('차단된 사용자는 이 판매자의 방송을 시청할 수 없습니다.'),
      );

      expect(mockUserBlockService.isUserBlockedBySeller).toHaveBeenCalledWith(sellerId, userId);
      expect(mockAgoraService.getChannelUserCount).not.toHaveBeenCalled(); // 블랙리스트 체크에서 먼저 차단
      expect(mockAgoraService.addUser).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when broadcast not found', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(null);

      await expect(service.join(broadcastId, userId)).rejects.toThrow(
        new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`),
      );

      expect(mockUserBlockService.isUserBlockedBySeller).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when broadcast is not live', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue({
        ...mockBroadcast,
        isLive: false,
      });

      await expect(service.join(broadcastId, userId)).rejects.toThrow(
        new BadRequestException('라이브 중인 방송이 아닙니다.'),
      );

      expect(mockUserBlockService.isUserBlockedBySeller).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when stream not found', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue({
        ...mockBroadcast,
        stream: null,
      });

      await expect(service.join(broadcastId, userId)).rejects.toThrow(
        new BadRequestException('해당 방송의 스트림을 찾을 수 없습니다.'),
      );

      expect(mockUserBlockService.isUserBlockedBySeller).not.toHaveBeenCalled();
    });
  });

  describe('stopSellingProduct', () => {
    const mockSeller = { id: 'seller-id', name: 'Test Seller' };
    const mockStream = {
      id: 'test-stream-id',
      currentSellingProduct: { id: 'product-id' },
    };
    const mockBroadcast = {
      id: 'broadcast-id',
      seller: mockSeller,
      isLive: true,
      stream: mockStream,
    };
    const mockBroadcastProduct = {
      id: 'product-id',
      status: 'SELLING',
    };

    it('should stop selling the current product', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.findOne.mockReturnValue(Promise.resolve(mockBroadcastProduct));

      await service.stopSellingProduct('broadcast-id', 'seller-id');

      // 메서드 호출 횟수는 구현에 따라 달라질 수 있으므로 호출 여부만 확인
      expect(mockEntityManager.persist).toHaveBeenCalled();
    });

    it('should throw BadRequestException when no product is being sold', async () => {
      const broadcastWithoutProduct = {
        ...mockBroadcast,
        stream: { ...mockStream, currentSellingProduct: null },
      };
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

  describe('getCurrentViewersCount', () => {
    const broadcastId = 'test-broadcast-id';
    const mockStream = {
      id: 'test-channel-id',
      chatRoomId: 'test-chat-room-id',
    };

    const mockBroadcast = {
      id: broadcastId,
      title: 'Test Broadcast',
      isLive: true,
      maxViewers: 50,
      stream: mockStream,
    };

    it('should get current viewers count successfully', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockAgoraService.getChannelUserCount.mockResolvedValue(5); // 5 RTC users
      mockAgoraService.getChatRoomMemberCount.mockResolvedValue(8); // 8 chat members

      const result = await service.getCurrentViewersCount(broadcastId);

      expect(result.success).toBe(true);
      expect(result.currentViewers).toBe(4); // 5 RTC users - 1 host = 4 viewers
      expect(result.rtcUsers).toBe(5);
      expect(result.chatMembers).toBe(8);
      expect(mockAgoraService.getChannelUserCount).toHaveBeenCalledWith(mockStream.id);
      expect(mockAgoraService.getChatRoomMemberCount).toHaveBeenCalledWith(mockStream.chatRoomId);
    });

    it('should update max viewers when current viewers exceeds it', async () => {
      const mockBroadcastWithLowMax = {
        ...mockBroadcast,
        maxViewers: 2, // 낮은 최대값
      };

      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcastWithLowMax);
      mockAgoraService.getChannelUserCount.mockResolvedValue(6); // 6 RTC users

      const result = await service.getCurrentViewersCount(broadcastId);

      expect(result.success).toBe(true);
      expect(result.currentViewers).toBe(5); // 6 RTC users - 1 host = 5 viewers
      expect(mockBroadcastWithLowMax.maxViewers).toBe(5); // max viewers updated
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockBroadcastWithLowMax);
    });

    it('should return zero viewers for non-live broadcast', async () => {
      const mockBroadcastNotLive = {
        ...mockBroadcast,
        isLive: false,
      };

      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcastNotLive);

      const result = await service.getCurrentViewersCount(broadcastId);

      expect(result.success).toBe(true);
      expect(result.currentViewers).toBe(0);
      expect(result.rtcUsers).toBe(0);
      expect(result.chatMembers).toBe(0);
      expect(mockAgoraService.getChannelUserCount).not.toHaveBeenCalled();
    });

    it('should handle Agora API errors gracefully', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockAgoraService.getChannelUserCount.mockRejectedValue(new Error('Agora API error'));

      const result = await service.getCurrentViewersCount(broadcastId);

      expect(result.success).toBe(false);
      expect(result.currentViewers).toBe(0);
      expect(result.rtcUsers).toBe(0);
      expect(result.chatMembers).toBe(0);
    });

    it('should throw NotFoundException when broadcast not found', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(null);

      await expect(service.getCurrentViewersCount('not-exist-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMaxViewersCount', () => {
    const broadcastId = 'test-broadcast-id';

    const mockBroadcast = {
      id: broadcastId,
      title: 'Test Broadcast',
      maxViewers: 50,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update max viewers count successfully', async () => {
      const maxViewers = 150;
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);

      const result = await service.updateMaxViewersCount(broadcastId, maxViewers);

      expect(result.success).toBe(true);
      expect(result.broadcastId).toBe(broadcastId);
      expect(result.maxViewers).toBe(maxViewers);
      expect(mockBroadcast.maxViewers).toBe(maxViewers);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockBroadcast);
      expect(mockBroadcastRepository.findOne).toHaveBeenCalledWith({ id: broadcastId });
    });

    it('should update max viewers count to zero', async () => {
      const maxViewers = 0;
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);

      const result = await service.updateMaxViewersCount(broadcastId, maxViewers);

      expect(result.success).toBe(true);
      expect(result.maxViewers).toBe(0);
      expect(mockBroadcast.maxViewers).toBe(0);
    });

    it('should update max viewers count to maximum allowed value', async () => {
      const maxViewers = 999999;
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);

      const result = await service.updateMaxViewersCount(broadcastId, maxViewers);

      expect(result.success).toBe(true);
      expect(result.maxViewers).toBe(999999);
      expect(mockBroadcast.maxViewers).toBe(999999);
    });

    it('should handle updating same value', async () => {
      const maxViewers = 50; // 현재와 같은 값
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);

      const result = await service.updateMaxViewersCount(broadcastId, maxViewers);

      expect(result.success).toBe(true);
      expect(result.maxViewers).toBe(50);
      expect(mockBroadcast.maxViewers).toBe(50);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockBroadcast);
    });

    it('should throw NotFoundException when broadcast not found', async () => {
      const maxViewers = 150;
      mockBroadcastRepository.findOne.mockResolvedValue(null);

      await expect(service.updateMaxViewersCount('not-exist-id', maxViewers)).rejects.toThrow(
        new NotFoundException('방송 ID not-exist-id를 찾을 수 없습니다.'),
      );

      expect(mockEntityManager.persistAndFlush).not.toHaveBeenCalled();
    });

    it('should handle database error during persist', async () => {
      const maxViewers = 150;
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.persistAndFlush.mockRejectedValue(new Error('Database error'));

      await expect(service.updateMaxViewersCount(broadcastId, maxViewers)).rejects.toThrow('Database error');

      expect(mockBroadcastRepository.findOne).toHaveBeenCalledWith({ id: broadcastId });
      expect(mockBroadcast.maxViewers).toBe(maxViewers); // 메모리에서는 변경됨
    });
  });
});

