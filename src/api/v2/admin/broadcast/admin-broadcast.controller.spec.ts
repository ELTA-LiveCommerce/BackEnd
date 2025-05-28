import { Test, TestingModule } from '@nestjs/testing';
import { AdminBroadcastController } from './admin-broadcast.controller';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { UserService } from '@/module/user/user.service';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import {
  AdminBroadcastListResponse,
  AdminBroadcastResponse,
  AdminBroadcastResponseBody,
} from './dto/admin-broadcast-response.dto';
import { AdminBroadcastListRequest, AdminBroadcastSortBy, SortOrder } from './dto/admin-broadcast-request.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';

describe('AdminBroadcastController', () => {
  let controller: AdminBroadcastController;
  let broadcastService: BroadcastService;
  let userService: UserService;

  const mockBroadcastService = {
    findSellerBroadcastsPaged: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getCurrentViewersCount: jest.fn(),
    updateMaxViewersCount: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBroadcastController],
      providers: [
        {
          provide: BroadcastService,
          useValue: mockBroadcastService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<AdminBroadcastController>(AdminBroadcastController);
    broadcastService = module.get<BroadcastService>(BroadcastService);
    userService = module.get<UserService>(UserService);

    // AdminBroadcastListResponse.fromResult 모킹
    jest.spyOn(AdminBroadcastListResponse, 'fromResult').mockImplementation((broadcasts, total, page, limit) => {
      const items = broadcasts.map((b: any) => ({
        id: b.id,
        title: b.title,
        sellerId: b.seller.id,
        sellerName: b.seller.name,
        scheduledAt: b.scheduledAt,
        createdAt: b.createdAt || new Date(),
        isLive: b.isLive,
        maxViewers: b.maxViewers || 0,
        currentViewers: b.currentViewers || 0,
        products: [],
      }));

      return {
        success: true,
        statusCode: 200,
        message: '요청 성공',
        data: {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
      } as AdminBroadcastListResponse;
    });

    // AdminBroadcastResponse.fromEntity 모킹
    jest.spyOn(AdminBroadcastResponse, 'fromEntity').mockImplementation((broadcast: any) => {
      const responseBody = {
        id: broadcast.id,
        title: broadcast.title,
        sellerId: broadcast.seller.id,
        sellerName: broadcast.seller.name,
        scheduledAt: broadcast.scheduledAt,
        createdAt: broadcast.createdAt,
        isLive: broadcast.isLive,
        maxViewers: broadcast.maxViewers,
        currentViewers: broadcast.currentViewers,
        products: [],
      };

      return {
        success: true,
        statusCode: 200,
        message: '요청 성공',
        data: responseBody,
        timestamp: new Date().toISOString(),
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
          currentViewers: 0,
          products: [],
        } as unknown as Broadcast,
        {
          id: 'broadcast-2',
          title: '테스트 방송 2',
          seller: { id: 'seller-2', name: '판매자 2' },
          scheduledAt: new Date('2023-07-02'),
          isLive: false,
          maxViewers: 0,
          currentViewers: 0,
          products: [],
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
          currentViewers: 0,
          products: [],
        } as unknown as Broadcast,
        {
          id: 'broadcast-2',
          title: '테스트 방송 2',
          seller: { id: 'seller-1', name: '판매자 1' },
          scheduledAt: new Date('2023-07-02'),
          isLive: false,
          maxViewers: 0,
          currentViewers: 0,
          products: [],
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

    it('should get broadcast by id', async () => {
      const broadcast = {
        id: 'broadcast-1',
        title: 'Test Broadcast',
        seller: { id: 'seller-1', name: 'Test Seller' },
        scheduledAt: new Date(),
        createdAt: new Date(),
        isLive: true,
        maxViewers: 100,
        currentViewers: 50,
        products: [],
      } as any;

      (broadcastService.findOne as jest.Mock).mockResolvedValue(broadcast);

      const mockResponse = {
        data: {
          id: 'broadcast-1',
          title: 'Test Broadcast',
          sellerId: 'seller-1',
          sellerName: 'Test Seller',
          scheduledAt: broadcast.scheduledAt,
          createdAt: broadcast.createdAt,
          isLive: true,
          maxViewers: 100,
          currentViewers: 50,
          products: [],
        },
      } as { data: AdminBroadcastResponseBody };

      const result = await controller.getBroadcast('broadcast-1');
      expect(result).toBeDefined();
      expect(broadcastService.findOne).toHaveBeenCalledWith('broadcast-1');
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
        currentViewers: 0,
        products: [],
        createdAt: new Date(),
      } as unknown as Broadcast;

      jest.spyOn(broadcastService, 'findOne').mockResolvedValue(mockBroadcast);

      // When
      const result = await controller.getBroadcast(broadcastId);

      // Then
      expect(broadcastService.findOne).toHaveBeenCalledWith(broadcastId);
      expect(result.data).toBeDefined();
      expect(result.data.data.id).toBe(broadcastId);
    });
  });

  describe('getCurrentViewersCount', () => {
    it('should get current viewers count successfully', async () => {
      const broadcastId = 'test-broadcast-id';
      const serviceResult = {
        success: true,
        currentViewers: 4,
        rtcUsers: 5,
        chatMembers: 8,
      };

      mockBroadcastService.getCurrentViewersCount.mockResolvedValue(serviceResult);

      const result = await controller.getCurrentViewersCount(broadcastId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('실시간 시청자수를 조회했습니다.');
      expect(result.data.broadcastId).toBe(broadcastId);
      expect(result.data.currentViewers).toBe(4);
      expect(result.data.rtcUsers).toBe(5);
      expect(result.data.chatMembers).toBe(8);
      expect(mockBroadcastService.getCurrentViewersCount).toHaveBeenCalledWith(broadcastId);
    });

    it('should handle service errors', async () => {
      const broadcastId = 'non-existent-id';

      mockBroadcastService.getCurrentViewersCount.mockRejectedValue(new Error('방송을 찾을 수 없습니다.'));

      await expect(controller.getCurrentViewersCount(broadcastId)).rejects.toThrow('방송을 찾을 수 없습니다.');
    });
  });

  describe('updateMaxViewersCount', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update max viewers count successfully', async () => {
      const broadcastId = 'test-broadcast-id';
      const updateRequest = { maxViewers: 100 };

      mockBroadcastService.updateMaxViewersCount.mockResolvedValue({
        success: true,
        broadcastId,
        maxViewers: 100,
      });

      const result = await controller.updateMaxViewersCount(broadcastId, updateRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('최대 시청자수가 성공적으로 설정되었습니다.');
      expect(result.data.broadcastId).toBe(broadcastId);
      expect(result.data.maxViewers).toBe(100);
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledWith(broadcastId, 100);
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledTimes(1);
    });

    it('should update max viewers count to zero', async () => {
      const broadcastId = 'test-broadcast-id';
      const updateRequest = { maxViewers: 0 };

      mockBroadcastService.updateMaxViewersCount.mockResolvedValue({
        success: true,
        broadcastId,
        maxViewers: 0,
      });

      const result = await controller.updateMaxViewersCount(broadcastId, updateRequest);

      expect(result.success).toBe(true);
      expect(result.data.maxViewers).toBe(0);
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledWith(broadcastId, 0);
    });

    it('should update max viewers count to maximum allowed value', async () => {
      const broadcastId = 'test-broadcast-id';
      const updateRequest = { maxViewers: 999999 };

      mockBroadcastService.updateMaxViewersCount.mockResolvedValue({
        success: true,
        broadcastId,
        maxViewers: 999999,
      });

      const result = await controller.updateMaxViewersCount(broadcastId, updateRequest);

      expect(result.success).toBe(true);
      expect(result.data.maxViewers).toBe(999999);
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledWith(broadcastId, 999999);
    });

    it('should handle service NotFoundException', async () => {
      const broadcastId = 'non-existent-id';
      const updateRequest = { maxViewers: 100 };

      const notFoundError = new Error('방송 ID non-existent-id를 찾을 수 없습니다.');
      notFoundError.name = 'NotFoundException';
      mockBroadcastService.updateMaxViewersCount.mockRejectedValue(notFoundError);

      await expect(controller.updateMaxViewersCount(broadcastId, updateRequest)).rejects.toThrow(notFoundError);
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledWith(broadcastId, 100);
    });

    it('should handle service database error', async () => {
      const broadcastId = 'test-broadcast-id';
      const updateRequest = { maxViewers: 100 };

      const dbError = new Error('Database connection failed');
      mockBroadcastService.updateMaxViewersCount.mockRejectedValue(dbError);

      await expect(controller.updateMaxViewersCount(broadcastId, updateRequest)).rejects.toThrow(dbError);
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledWith(broadcastId, 100);
    });

    it('should handle invalid broadcast ID format', async () => {
      const invalidBroadcastId = '';
      const updateRequest = { maxViewers: 100 };

      // 빈 ID로 서비스 호출 시 에러 발생
      const validationError = new Error('Invalid broadcast ID');
      mockBroadcastService.updateMaxViewersCount.mockRejectedValue(validationError);

      await expect(controller.updateMaxViewersCount(invalidBroadcastId, updateRequest)).rejects.toThrow(
        validationError,
      );
    });

    it('should preserve original request data in service call', async () => {
      const broadcastId = 'test-broadcast-id';
      const updateRequest = { maxViewers: 12345 };

      mockBroadcastService.updateMaxViewersCount.mockResolvedValue({
        success: true,
        broadcastId,
        maxViewers: 12345,
      });

      await controller.updateMaxViewersCount(broadcastId, updateRequest);

      // 정확한 값이 서비스로 전달되는지 확인
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledWith(broadcastId, 12345);
      expect(mockBroadcastService.updateMaxViewersCount).toHaveBeenCalledWith(expect.any(String), expect.any(Number));
    });
  });
});

