import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { BroadcastController } from '@/api/v2/viewer/live/broadcast.controller';
import { BroadcastProductStatus } from '@/module/product/entity/broadcast-product.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';

describe('Viewer Broadcast Controller', () => {
  let controller: BroadcastController;
  let broadcastService: BroadcastService;

  const mockUser = {
    id: 'user-id',
    name: '테스트 유저',
  } as User;

  const mockProduct = {
    id: 'product-id',
    name: '테스트 상품',
    mainImage: 'image-url.jpg',
    price: 10000,
  } as Product;

  const mockBroadcastProduct = {
    id: 'broadcast-product-id',
    product: mockProduct,
    sortOrder: 1,
    status: BroadcastProductStatus.SELLING,
    soldQuantity: 0,
    specialPrice: 8000,
  } as BroadcastProduct;

  const mockBroadcastService = {
    join: jest.fn().mockResolvedValue({
      broadcastId: 'broadcast-id',
      channelId: 'channel-id',
      uid: 'user-id',
      rtcToken: 'rtc-token',
      chatToken: 'chat-token',
    }),
    renew: jest.fn().mockResolvedValue({
      broadcastId: 'broadcast-id',
      channelId: 'channel-id',
      uid: 'user-id',
      rtcToken: 'new-rtc-token',
      chatToken: 'new-chat-token',
    }),
    getCurrentSellingProduct: jest.fn(),
    getBroadcastProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BroadcastController],
      providers: [
        {
          provide: BroadcastService,
          useValue: mockBroadcastService,
        },
      ],
    }).compile();

    controller = module.get<BroadcastController>(BroadcastController);
    broadcastService = module.get<BroadcastService>(BroadcastService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('join', () => {
    const joinDto = { broadcastId: 'broadcast-id' };

    it('should successfully join broadcast when user is not blocked', async () => {
      const result = await controller.join(joinDto, mockUser);

      expect(result.broadcastId).toBe('broadcast-id');
      expect(result.channelId).toBe('channel-id');
      expect(result.uid).toBe('user-id');
      expect(broadcastService.join).toHaveBeenCalledWith('broadcast-id', 'user-id');
    });

    it('should throw ForbiddenException when user is blocked by seller', async () => {
      mockBroadcastService.join.mockRejectedValueOnce(
        new ForbiddenException('차단된 사용자는 이 판매자의 방송을 시청할 수 없습니다.'),
      );

      await expect(controller.join(joinDto, mockUser)).rejects.toThrow(
        new ForbiddenException('차단된 사용자는 이 판매자의 방송을 시청할 수 없습니다.'),
      );

      expect(broadcastService.join).toHaveBeenCalledWith('broadcast-id', 'user-id');
    });

    it('should throw NotFoundException when broadcast not found', async () => {
      mockBroadcastService.join.mockRejectedValueOnce(
        new NotFoundException('방송 ID broadcast-id를 찾을 수 없습니다.'),
      );

      await expect(controller.join(joinDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when broadcast is not live', async () => {
      mockBroadcastService.join.mockRejectedValueOnce(new BadRequestException('라이브 중인 방송이 아닙니다.'));

      await expect(controller.join(joinDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    afterEach(() => {
      // join 메서드의 mock을 초기 상태로 되돌림
      mockBroadcastService.join.mockResolvedValue({
        broadcastId: 'broadcast-id',
        channelId: 'channel-id',
        uid: 'user-id',
        rtcToken: 'rtc-token',
        chatToken: 'chat-token',
      });
    });
  });

  describe('getCurrentSellingProduct', () => {
    it('should return the current selling product', async () => {
      mockBroadcastService.getCurrentSellingProduct.mockResolvedValueOnce(mockBroadcastProduct);

      const result = await controller.getCurrentSellingProduct('broadcast-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // null 체크 추가
      if (result.data !== null) {
        expect(result.data.id).toBe('broadcast-product-id');
        expect(result.data.productName).toBe('테스트 상품');
      }
      expect(broadcastService.getCurrentSellingProduct).toHaveBeenCalledWith('broadcast-id');
    });

    it('should return null when no product is being sold', async () => {
      mockBroadcastService.getCurrentSellingProduct.mockResolvedValueOnce(null);

      const result = await controller.getCurrentSellingProduct('broadcast-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toContain('없습니다');
    });

    it('should throw an exception when broadcast is not found', async () => {
      mockBroadcastService.getCurrentSellingProduct.mockRejectedValueOnce(
        new NotFoundException('방송을 찾을 수 없습니다.'),
      );

      await expect(controller.getCurrentSellingProduct('not-exist-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBroadcastProducts', () => {
    it('should return the list of broadcast products', async () => {
      mockBroadcastService.getBroadcastProducts.mockResolvedValueOnce([mockBroadcastProduct]);

      const result = await controller.getBroadcastProducts('broadcast-id');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe('broadcast-product-id');
      expect(broadcastService.getBroadcastProducts).toHaveBeenCalledWith('broadcast-id');
    });

    it('should return empty array when no products exist', async () => {
      mockBroadcastService.getBroadcastProducts.mockResolvedValueOnce([]);

      const result = await controller.getBroadcastProducts('broadcast-id');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
    });

    it('should throw an exception when broadcast is not found', async () => {
      mockBroadcastService.getBroadcastProducts.mockRejectedValueOnce(
        new NotFoundException('방송을 찾을 수 없습니다.'),
      );

      await expect(controller.getBroadcastProducts('not-exist-id')).rejects.toThrow(NotFoundException);
    });
  });
});

