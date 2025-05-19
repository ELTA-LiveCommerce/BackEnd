import { Test, TestingModule } from '@nestjs/testing';
import { AdminDeliveryController } from '@/api/v2/admin/delivery/admin-delivery.controller';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import {
  AdminDeliveryListRequest,
  AdminUpdateDeliveryStatusRequest,
  AdminUpdateDeliveryTrackingRequest,
} from '@/api/v2/admin/delivery/dto/admin-delivery-request.dto';
import { SellerDeliverySearchField } from '@/api/v2/seller/delivery/delivery-search-field.enum';

describe('AdminDeliveryController', () => {
  let controller: AdminDeliveryController;
  let deliveryService: DeliveryService;

  const mockUser = { id: 'admin-id', role: 'ADMIN' };

  const mockDelivery = {
    id: 'delivery-1',
    status: DeliveryStatus.PREPARING,
    trackingNumber: '123456789',
    courierCompany: '우체국택배',
    recipientName: '홍길동',
    recipientPhoneNumber: '010-1234-5678',
    address: '서울시 강남구',
    order: { id: 'order-1' },
    seller: { id: 'seller-1' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderItems = [
    {
      id: 'item-1',
      product: {
        id: 'product-1',
        name: '테스트 상품',
        mainImage: 'https://example.com/image.jpg',
      },
      quantity: 2,
    },
  ];

  const mockDeliveryService = {
    findSellerDeliveriesPaged: jest.fn(),
    findOne: jest.fn(),
    updateDeliveryStatus: jest.fn(),
    updateTrackingInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDeliveryController],
      providers: [
        {
          provide: DeliveryService,
          useValue: mockDeliveryService,
        },
      ],
    }).compile();

    controller = module.get<AdminDeliveryController>(AdminDeliveryController);
    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDeliveryList', () => {
    it('셀러 ID로 배송 목록을 조회해야 함', async () => {
      // Given
      const query: AdminDeliveryListRequest = {
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
      };

      const mockResult = {
        items: [
          {
            delivery: mockDelivery,
            orderItems: mockOrderItems,
            order: { id: 'order-1' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockResult);

      // When
      const result = await controller.getDeliveryList(query, mockUser as any);

      // Then
      expect(deliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith('seller-1', {
        page: 1,
        limit: 10,
        searchField: undefined,
        searchKeyword: undefined,
        sortOrder: undefined,
      });
      expect(result.data.total).toBe(1);
      expect(result.data.items.length).toBeGreaterThan(0);
    });

    it('검색어가 있는 경우 송장 번호로 검색해야 함', async () => {
      // Given
      const query: AdminDeliveryListRequest = {
        page: 1,
        limit: 10,
        sellerId: 'seller-1',
        search: '123456',
      };

      const mockResult = {
        items: [
          {
            delivery: mockDelivery,
            orderItems: mockOrderItems,
            order: { id: 'order-1' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockResult);

      // When
      const result = await controller.getDeliveryList(query, mockUser as any);

      // Then
      expect(deliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith('seller-1', {
        page: 1,
        limit: 10,
        searchField: SellerDeliverySearchField.TRACKING_NUMBER,
        searchKeyword: '123456',
        sortOrder: undefined,
      });
    });
  });

  describe('updateDeliveryStatus', () => {
    it('배송 상태를 업데이트해야 함', async () => {
      // Given
      const id = 'delivery-1';
      const dto: AdminUpdateDeliveryStatusRequest = {
        status: DeliveryStatus.SHIPPING,
      };

      const updatedDelivery = {
        ...mockDelivery,
        status: DeliveryStatus.SHIPPING,
        shippedAt: new Date(),
      };

      mockDeliveryService.updateDeliveryStatus.mockResolvedValue(updatedDelivery);

      // When
      const result = await controller.updateDeliveryStatus(id, dto, mockUser as any);

      // Then
      expect(deliveryService.updateDeliveryStatus).toHaveBeenCalledWith(id, dto.status, mockUser);
      expect(result.data.status).toBe(DeliveryStatus.SHIPPING);
    });
  });

  describe('updateDeliveryTracking', () => {
    it('송장 번호를 업데이트해야 함', async () => {
      // Given
      const id = 'delivery-1';
      const dto: AdminUpdateDeliveryTrackingRequest = {
        trackingNumber: '987654321',
        courierCompany: 'CJ대한통운',
      };

      const updatedDelivery = {
        ...mockDelivery,
        trackingNumber: '987654321',
        courierCompany: 'CJ대한통운',
      };

      mockDeliveryService.updateTrackingInfo.mockResolvedValue(updatedDelivery);

      // When
      const result = await controller.updateDeliveryTracking(id, dto, mockUser as any);

      // Then
      expect(deliveryService.updateTrackingInfo).toHaveBeenCalledWith(
        id,
        dto.trackingNumber,
        dto.courierCompany,
        mockUser,
      );
      expect(result.data.trackingNumber).toBe('987654321');
      expect(result.data.courierCompany).toBe('CJ대한통운');
    });
  });
});
