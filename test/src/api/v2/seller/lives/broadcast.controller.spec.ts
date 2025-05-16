import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { BroadcastController } from '@/api/v2/seller/lives/broadcast.controller';
import { BroadcastProductStatus } from '@/module/product/entity/broadcast-product.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { UpdateCurrentSellingProductDto } from '@/module/broadcast/dto/current-selling-product.dto';

describe('Seller Broadcast Controller', () => {
  let controller: BroadcastController;
  let broadcastService: BroadcastService;

  const mockSeller = {
    id: 'seller-id',
    name: '테스트 판매자',
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
    start: jest.fn().mockResolvedValue({
      broadcastId: 'broadcast-id',
      channelId: 'channel-id',
      uid: 'seller-id',
      rtcToken: 'rtc-token',
      chatToken: 'chat-token',
    }),
    end: jest.fn().mockResolvedValue({
      success: true,
      message: '방송이 종료되었습니다.',
    }),
    delete: jest.fn().mockResolvedValue({
      success: true,
      message: '방송이 삭제되었습니다.',
    }),
    renew: jest.fn().mockResolvedValue({
      broadcastId: 'broadcast-id',
      channelId: 'channel-id',
      uid: 'seller-id',
      rtcToken: 'new-rtc-token',
      chatToken: 'new-chat-token',
    }),
    getCurrentSellingProduct: jest.fn(),
    getBroadcastProducts: jest.fn(),
    updateCurrentSellingProduct: jest.fn(),
    stopSellingProduct: jest.fn(),
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

  describe('getCurrentSellingProduct', () => {
    it('should return the current selling product', async () => {
      mockBroadcastService.getCurrentSellingProduct.mockResolvedValueOnce(mockBroadcastProduct);

      const result = await controller.getCurrentSellingProduct('broadcast-id', mockSeller);

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

      const result = await controller.getCurrentSellingProduct('broadcast-id', mockSeller);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toContain('없습니다');
    });

    it('should throw an exception when broadcast is not found', async () => {
      mockBroadcastService.getCurrentSellingProduct.mockRejectedValueOnce(
        new NotFoundException('방송을 찾을 수 없습니다.'),
      );

      await expect(controller.getCurrentSellingProduct('not-exist-id', mockSeller)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBroadcastProducts', () => {
    it('should return the list of broadcast products', async () => {
      mockBroadcastService.getBroadcastProducts.mockResolvedValueOnce([mockBroadcastProduct]);

      const result = await controller.getBroadcastProducts('broadcast-id', mockSeller);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe('broadcast-product-id');
      expect(broadcastService.getBroadcastProducts).toHaveBeenCalledWith('broadcast-id');
    });

    it('should return empty array when no products exist', async () => {
      mockBroadcastService.getBroadcastProducts.mockResolvedValueOnce([]);

      const result = await controller.getBroadcastProducts('broadcast-id', mockSeller);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
    });

    it('should throw an exception when broadcast is not found', async () => {
      mockBroadcastService.getBroadcastProducts.mockRejectedValueOnce(
        new NotFoundException('방송을 찾을 수 없습니다.'),
      );

      await expect(controller.getBroadcastProducts('not-exist-id', mockSeller)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCurrentSellingProduct', () => {
    it('should update current selling product', async () => {
      mockBroadcastService.updateCurrentSellingProduct.mockResolvedValueOnce(mockBroadcastProduct);

      const dto: UpdateCurrentSellingProductDto = {
        productId: 'product-id',
      };

      const result = await controller.updateCurrentSellingProduct('broadcast-id', dto, mockSeller);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('broadcast-product-id');
      expect(broadcastService.updateCurrentSellingProduct).toHaveBeenCalledWith(
        'broadcast-id',
        'product-id',
        'seller-id',
      );
    });

    it('should throw ForbiddenException when seller is not the owner', async () => {
      mockBroadcastService.updateCurrentSellingProduct.mockRejectedValueOnce(
        new ForbiddenException('이 방송의 상품을 변경할 권한이 없습니다.'),
      );

      const dto: UpdateCurrentSellingProductDto = {
        productId: 'product-id',
      };

      await expect(controller.updateCurrentSellingProduct('broadcast-id', dto, mockSeller)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when product is not found', async () => {
      mockBroadcastService.updateCurrentSellingProduct.mockRejectedValueOnce(
        new NotFoundException('해당 방송에 연결된 상품을 찾을 수 없습니다.'),
      );

      const dto: UpdateCurrentSellingProductDto = {
        productId: 'non-existent-id',
      };

      await expect(controller.updateCurrentSellingProduct('broadcast-id', dto, mockSeller)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('stopSellingProduct', () => {
    it('should stop selling the current product', async () => {
      mockBroadcastService.stopSellingProduct.mockResolvedValueOnce(undefined);

      const result = await controller.stopSellingProduct('broadcast-id', mockSeller);

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.message).toContain('중지');
      expect(broadcastService.stopSellingProduct).toHaveBeenCalledWith('broadcast-id', 'seller-id');
    });

    it('should throw BadRequestException when no product is being sold', async () => {
      mockBroadcastService.stopSellingProduct.mockRejectedValueOnce(
        new BadRequestException('현재 판매 중인 상품이 없습니다.'),
      );

      await expect(controller.stopSellingProduct('broadcast-id', mockSeller)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when seller is not the owner', async () => {
      mockBroadcastService.stopSellingProduct.mockRejectedValueOnce(
        new ForbiddenException('이 방송의 상품을 변경할 권한이 없습니다.'),
      );

      await expect(controller.stopSellingProduct('broadcast-id', mockSeller)).rejects.toThrow(ForbiddenException);
    });
  });
});

