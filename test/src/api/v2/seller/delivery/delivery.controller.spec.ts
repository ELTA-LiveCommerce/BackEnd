import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryController } from '@/api/v2/seller/delivery/delivery.controller';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { SellerDeliveryListRequestDto } from '@/api/v2/seller/delivery/delivery.request.dto';
import { SellerDeliveryListItemDto } from '@/api/v2/seller/delivery/delivery.response.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Delivery, DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { Order } from '@/module/order/entity/order.entity';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { SellerDeliverySearchField } from '@/api/v2/seller/delivery/delivery-search-field.enum';
import { SellerDeliveryDateField } from '@/api/v2/seller/delivery/delivery-date-field.enum';

describe('DeliveryController', () => {
  let controller: DeliveryController;
  let mockDeliveryService: MockProxy<DeliveryService>;

  const mockSeller = mock<User>({ id: 'seller-uuid-1' });

  const mockProduct = mock<Product>({
    id: 'product-uuid-1',
    name: '테스트 상품',
    mainImage: 'https://example.com/image.jpg',
  });

  const mockUser = mock<User>({
    id: 'user-uuid-1',
    loginId: 'buyer123',
  });

  const mockOrder = mock<Order>({
    id: 'order-uuid-1',
    user: mockUser,
  });

  const mockOrderItem = mock<OrderItem>({
    id: 'order-item-uuid-1',
    product: mockProduct,
    quantity: 2,
  });

  const mockDelivery = mock<Delivery>({
    id: 'delivery-uuid-1',
    trackingNumber: '1234567890',
    recipientName: '김수령',
    recipientPhoneNumber: '010-1111-2222',
    baseAddress: '서울시 테스트구',
    detailAddress: '테스트로 123',
    postalCode: '12345',
    status: DeliveryStatus.SHIPPING,
    order: mockOrder,
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
    it('배송 목록을 성공적으로 조회해야 함', async () => {
      const requestDto = new SellerDeliveryListRequestDto();
      requestDto.page = 1;
      requestDto.limit = 10;

      const mockServiceResult = {
        items: [{ delivery: mockDelivery, orderItem: mockOrderItem, order: mockOrder }],
        total: 1,
        page: requestDto.page,
        limit: requestDto.limit,
      };
      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockServiceResult);

      const result = await controller.getSellerDeliveries(requestDto, mockSeller);

      expect(mockDeliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith(mockSeller.id, requestDto);
      expect(result).toBeInstanceOf(PagedResponseV2);
      expect(result.success).toBe(true);
      expect(result.data.items.length).toBe(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(requestDto.page);
      expect(result.data.limit).toBe(requestDto.limit);

      const expectedDto = SellerDeliveryListItemDto.fromEntities(mockDelivery, mockOrderItem, mockOrder);
      expect(result.data.items[0]).toMatchObject({
        productMainImage: mockProduct.mainImage,
        productName: mockProduct.name,
        quantity: mockOrderItem.quantity,
        trackingNumber: mockDelivery.trackingNumber,
        buyerLoginId: mockUser.loginId,
        recipientName: mockDelivery.recipientName,
        recipientPhoneNumber: mockDelivery.recipientPhoneNumber,
        address: `${mockDelivery.baseAddress} ${mockDelivery.detailAddress} (${mockDelivery.postalCode})`,
        deliveryStatus: mockDelivery.status,
        orderId: mockOrder.id,
        orderItemId: mockOrderItem.id,
        deliveryId: mockDelivery.id,
      });
    });

    it('모든 검색/필터 조건을 사용하여 배송 목록을 조회해야 함', async () => {
      const requestDto = new SellerDeliveryListRequestDto();
      requestDto.page = 1;
      requestDto.limit = 5;
      requestDto.searchField = SellerDeliverySearchField.RECIPIENT_NAME;
      requestDto.searchKeyword = '김수령';
      requestDto.dateField = SellerDeliveryDateField.ORDER_DATE;
      requestDto.startDate = new Date('2023-01-01').toISOString().split('T')[0];
      requestDto.endDate = new Date('2023-12-31').toISOString().split('T')[0];

      const mockServiceResult = {
        items: [{ delivery: mockDelivery, orderItem: mockOrderItem, order: mockOrder }],
        total: 1,
        page: requestDto.page,
        limit: requestDto.limit,
      };
      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockServiceResult);

      await controller.getSellerDeliveries(requestDto, mockSeller);

      expect(mockDeliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith(mockSeller.id, requestDto);
    });

    it('기본값으로 배송 목록을 조회해야 함 (필터 조건 없을 때)', async () => {
      const requestDto = new SellerDeliveryListRequestDto();

      const mockServiceResult = {
        items: [{ delivery: mockDelivery, orderItem: mockOrderItem, order: mockOrder }],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockDeliveryService.findSellerDeliveriesPaged.mockResolvedValue(mockServiceResult);

      const result = await controller.getSellerDeliveries(requestDto, mockSeller);

      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(mockDeliveryService.findSellerDeliveriesPaged).toHaveBeenCalledWith(
        mockSeller.id,
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });
  });
});
