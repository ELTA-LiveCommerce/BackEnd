import { Test, TestingModule } from '@nestjs/testing';
import { AdminBroadcastController } from './admin-broadcast.controller';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { UserService } from '@/module/user/user.service';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { AdminBroadcastListResponse, AdminBroadcastResponse } from './dto/admin-broadcast-response.dto';
import { AdminBroadcastListRequest, AdminBroadcastSortBy, SortOrder } from './dto/admin-broadcast-request.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';

describe('AdminBroadcastController', () => {
  let controller: AdminBroadcastController;
  let broadcastService: BroadcastService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBroadcastController],
      providers: [
        {
          provide: BroadcastService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            findSellerBroadcastsPaged: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminBroadcastController>(AdminBroadcastController);
    broadcastService = module.get<BroadcastService>(BroadcastService);
    userService = module.get<UserService>(UserService);

    // AdminBroadcastListResponse.fromResult 모킹
    jest.spyOn(AdminBroadcastListResponse, 'fromResult').mockImplementation((broadcasts, total, page, limit) => {
      return {
        data: {
          items: broadcasts.map((b: any) => ({
            id: b.id,
            title: b.title,
            sellerId: b.seller.id,
            sellerName: b.seller.name,
            scheduledAt: b.scheduledAt,
            createdAt: b.createdAt || new Date(),
            isLive: b.isLive,
            maxViewers: b.maxViewers || 0,
            products: [],
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      } as AdminBroadcastListResponse;
    });

    // AdminBroadcastResponse.fromEntity 모킹
    jest.spyOn(AdminBroadcastResponse, 'fromEntity').mockImplementation((broadcast: any) => {
      return {
        id: broadcast.id,
        title: broadcast.title,
        sellerId: broadcast.seller.id,
        sellerName: broadcast.seller.name,
        scheduledAt: broadcast.scheduledAt,
        createdAt: broadcast.createdAt,
        isLive: broadcast.isLive,
        maxViewers: broadcast.maxViewers,
        products: [],
      } as AdminBroadcastResponse;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBroadcasts', () => {
    it('모든 방송 목록을 반환해야 함', async () => {
      // Given
      const query: AdminBroadcastListRequest = {
        page: 1,
        limit: 10,
        search: '',
        sortBy: AdminBroadcastSortBy.SCHEDULED_AT,
        sortOrder: SortOrder.DESC,
      };

      const mockBroadcasts = [
        {
          id: 'broadcast-1',
          title: '테스트 방송 1',
          seller: { id: 'seller-1', name: '판매자 1' },
          scheduledAt: new Date('2023-07-01'),
          isLive: false,
          maxViewers: 0,
          products: { getItems: () => [], isInitialized: () => true },
        } as unknown as Broadcast,
        {
          id: 'broadcast-2',
          title: '테스트 방송 2',
          seller: { id: 'seller-2', name: '판매자 2' },
          scheduledAt: new Date('2023-07-02'),
          isLive: false,
          maxViewers: 0,
          products: { getItems: () => [], isInitialized: () => true },
        } as unknown as Broadcast,
      ];

      jest.spyOn(broadcastService, 'findAll').mockResolvedValue(mockBroadcasts);

      // When
      const result = await controller.getBroadcasts(query);

      // Then
      expect(broadcastService.findAll).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.data.items.length).toBe(mockBroadcasts.length);
      expect(result.data.total).toBe(mockBroadcasts.length);
    });

    it('셀러 ID로 필터링된 방송 목록을 반환해야 함', async () => {
      // Given
      const sellerId = 'seller-1';
      const query: AdminBroadcastListRequest = {
        page: 1,
        limit: 10,
        search: '',
        sellerId,
        sortBy: AdminBroadcastSortBy.SCHEDULED_AT,
        sortOrder: SortOrder.DESC,
      };

      const mockItems = [
        {
          id: 'broadcast-1',
          title: '테스트 방송 1',
        } as BroadcastListItemDto,
        {
          id: 'broadcast-2',
          title: '테스트 방송 2',
        } as BroadcastListItemDto,
      ];

      const mockPagedResponse = {
        data: {
          items: mockItems,
          total: mockItems.length,
          page: 1,
          limit: 10,
        },
      } as PagedResponseV2<BroadcastListItemDto>;

      const mockBroadcasts = [
        {
          id: 'broadcast-1',
          title: '테스트 방송 1',
          seller: { id: 'seller-1', name: '판매자 1' },
          scheduledAt: new Date('2023-07-01'),
          isLive: false,
          maxViewers: 0,
          products: { getItems: () => [], isInitialized: () => true },
        } as unknown as Broadcast,
        {
          id: 'broadcast-2',
          title: '테스트 방송 2',
          seller: { id: 'seller-1', name: '판매자 1' },
          scheduledAt: new Date('2023-07-02'),
          isLive: false,
          maxViewers: 0,
          products: { getItems: () => [], isInitialized: () => true },
        } as unknown as Broadcast,
      ];

      jest.spyOn(broadcastService, 'findSellerBroadcastsPaged').mockResolvedValue(mockPagedResponse);
      jest
        .spyOn(broadcastService, 'findOne')
        .mockResolvedValueOnce(mockBroadcasts[0])
        .mockResolvedValueOnce(mockBroadcasts[1]);

      // When
      const result = await controller.getBroadcasts(query);

      // Then
      expect(broadcastService.findSellerBroadcastsPaged).toHaveBeenCalledWith(sellerId, expect.any(Object));
      expect(broadcastService.findOne).toHaveBeenCalledTimes(mockItems.length);
      expect(result.data).toBeDefined();
      expect(result.data.items.length).toBe(mockItems.length);
      expect(result.data.total).toBe(mockItems.length);
    });
  });

  describe('getBroadcast', () => {
    it('방송 ID로 단일 방송을 반환해야 함', async () => {
      // Given
      const broadcastId = 'broadcast-1';
      const mockBroadcast = {
        id: broadcastId,
        title: '테스트 방송 1',
        seller: { id: 'seller-1', name: '판매자 1' },
        scheduledAt: new Date('2023-07-01'),
        isLive: false,
        maxViewers: 0,
        products: { getItems: () => [], isInitialized: () => true },
        createdAt: new Date(),
      } as unknown as Broadcast;

      jest.spyOn(broadcastService, 'findOne').mockResolvedValue(mockBroadcast);

      // When
      const result = await controller.getBroadcast(broadcastId);

      // Then
      expect(broadcastService.findOne).toHaveBeenCalledWith(broadcastId);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(broadcastId);
    });
  });
});

