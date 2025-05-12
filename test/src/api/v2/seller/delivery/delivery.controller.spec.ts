import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryController } from '@/api/v2/seller/delivery/delivery.controller';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { SellerDeliveryListRequestDto } from '@/api/v2/seller/delivery/delivery.request.dto';
import {
  SellerDeliveryListResponseDto,
  SellerDeliveryListItemDto,
} from '@/api/v2/seller/delivery/delivery.response.dto';
import { Delivery, DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import { Order } from '@/module/order/entity/order.entity';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { mock, MockProxy } from 'jest-mock-extended';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { SellerDeliveryDateField } from '@/api/v2/seller/delivery/delivery-date-field.enum';
import { HttpStatus } from '@nestjs/common';
import { Loaded, Collection } from '@mikro-orm/core';

describe('Seller DeliveryController (E2E - Mock Service)', () => {
  let controller: DeliveryController;
  let mockDeliveryService: MockProxy<DeliveryService>;

  const mockSeller: User = {
    id: 'test-seller-id',
    role: UserRole.SELLER,
  } as User;

  const mockOrderItem = mock<OrderItem>({
    id: 'item-1',
    product: mock<Product>({
      id: 'product-1',
      name: '테스트 상품',
    }),
    quantity: 1,
    price: 10000,
  });

  const mockOrder = mock<Order>({
    id: 'order-1',
    user: mock<User>({ id: 'buyer-1', name: '구매자' }),
    createdAt: new Date('2024-01-10T10:00:00Z'),
    items: {
      getItems: jest.fn().mockReturnValue([mockOrderItem]),
    } as unknown as Collection<OrderItem>,
  });

  const mockProduct = mock<Product>({
    id: 'product-1',
    name: '테스트 상품',
  });

  const mockDelivery = mock<Delivery>({
    id: 'delivery-1',
    trackingNumber: '1234567890',
    recipientName: '수령인 이름',
    recipientPhoneNumber: '010-1234-5678',
    address: '서울시 테스트구 테스트동 123-45',
    status: DeliveryStatus.SHIPPING,
    order: mockOrder,
    seller: mockSeller,
    createdAt: new Date('2024-01-11T11:00:00Z'),
    shippedAt: new Date('2024-01-12T12:00:00Z'),
  });

  beforeEach(async () => {
    mockDeliveryService = mock<DeliveryService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryController],
      providers: [
        {
          provide: DeliveryService,
          useValue: mockDeliveryService,
        },
      ],
    }).compile();

    controller = module.get<DeliveryController>(DeliveryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSellerDeliveries', () => {
    it('should return paginated deliveries for the seller', async () => {
      const query = new SellerDeliveryListRequestDto();
      query.page = 1;
      query.limit = 5;

      const mockServiceResult = {
        items: [
          {
            delivery: mockDelivery as Loaded<Delivery, 'order.user'>,
            orderItems: [mockOrderItem as Loaded<OrderItem, 'product'>],
            order: mockOrder as Loaded<Order, 'user' | 'items.product'>,
          },
        ],
        total: 1,
        page: query.page,
        limit: query.limit,
      };
      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockServiceResult);

      const expectedDtoItem = SellerDeliveryListItemDto.fromEntities(mockDelivery, mockOrderItem, mockOrder);

      const expectedResponse = PagedResponseV2.create(
        [expectedDtoItem],
        mockServiceResult.total,
        mockServiceResult.page,
        mockServiceResult.limit,
        '배송 목록 조회 성공',
      );

      const result = await controller.getSellerDeliveries(query, mockSeller);

      expect(mockDeliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith(mockSeller.id, query);
      expect(result).toEqual(expectedResponse);
      expect(result.data.items[0].deliveryId).toBe(mockDelivery.id);
      expect(result.data.items[0].orderId).toBe(mockOrder.id);
      expect(result.data.items[0].productName).toBe(mockProduct.name);
      expect(result.data.items[0].address).toBe(mockDelivery.address);
    });

    it('should handle empty results', async () => {
      const query = new SellerDeliveryListRequestDto();
      query.page = 1;
      query.limit = 10;

      const mockServiceResult = { items: [], total: 0, page: 1, limit: 10 };
      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockServiceResult);

      const expectedResponse = PagedResponseV2.create<SellerDeliveryListItemDto>([], 0, 1, 10, '배송 목록 조회 성공');

      const result = await controller.getSellerDeliveries(query, mockSeller);

      expect(mockDeliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith(mockSeller.id, query);
      expect(result).toEqual(expectedResponse);
      expect(result.data.items.length).toBe(0);
      expect(result.data.total).toBe(0);
    });

    it('should handle different page and limit', async () => {
      const query = new SellerDeliveryListRequestDto();
      query.page = 2;
      query.limit = 3;

      const mockServiceResult = { items: [], total: 0, page: 2, limit: 3 };
      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockServiceResult);

      const expectedResponse = PagedResponseV2.create<SellerDeliveryListItemDto>([], 0, 2, 3, '배송 목록 조회 성공');

      const result = await controller.getSellerDeliveries(query, mockSeller);

      expect(mockDeliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith(mockSeller.id, query);
      expect(result).toEqual(expectedResponse);
    });

    it('should use correct date field for filtering', async () => {
      const query = new SellerDeliveryListRequestDto();
      query.dateField = SellerDeliveryDateField.ORDER_DATE;
      query.startDate = '2024-01-01';
      query.endDate = '2024-01-15';

      const mockServiceResult = { items: [], total: 0, page: 1, limit: 10 };
      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockServiceResult);

      await controller.getSellerDeliveries(query, mockSeller);

      expect(mockDeliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith(mockSeller.id, query);
    });

    // TODO: Add tests for search field filtering if needed
  });
});
