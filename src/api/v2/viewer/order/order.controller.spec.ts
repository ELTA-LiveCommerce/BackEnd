import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from '@/module/order/order.service';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import { User } from '@/module/user/entity/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderRequest, GetOrdersRequest, CancelOrderRequest } from './order-request.dto';
import { OrderResponseBody, OrderSummaryResponseBody } from './order-response.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: MockProxy<OrderService>;
  let deliveryService: MockProxy<DeliveryService>;

  const mockUser = {
    id: 'test-user-id',
    name: '테스트 사용자',
    loginId: 'testuser',
  } as User;

  const mockOrderResponse = {
    id: 'test-order-id',
    orderNumber: 'ORD20240601123456',
    userId: 'test-user-id',
    status: OrderStatus.PAID,
    items: [
      {
        id: 'test-item-id',
        productId: 'test-product-id',
        productName: '테스트 상품',
        quantity: 2,
        price: 25000,
        totalPrice: 50000,
        productImage: 'http://example.com/image.jpg',
      },
    ],
    totalAmount: 50000,
    paymentMethod: '신용카드',
    shippingAddress: '서울시 강남구 테스트동 123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderSummary = {
    id: 'test-order-id',
    orderNumber: 'ORD20240601123456',
    status: OrderStatus.PAID,
    totalAmount: 50000,
    itemCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeliveryResponse = {
    deliveries: [
      {
        delivery: {
          id: 'test-delivery-id',
          status: DeliveryStatus.SHIPPING,
          trackingNumber: '1234567890',
          courierCompany: 'CJ대한통운',
          recipientName: '수취인',
          recipientPhoneNumber: '010-1234-5678',
          address: '서울시 강남구 테스트동 123',
          shippedAt: new Date(),
          deliveredAt: null,
          canceledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        seller: {
          id: 'test-seller-id',
          name: '테스트 판매자',
        },
        orderItems: [
          {
            id: 'test-item-id',
            productId: 'test-product-id',
            productName: '테스트 상품',
            productImage: 'http://example.com/image.jpg',
            quantity: 2,
            price: 25000,
            totalPrice: 50000,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    orderService = mock<OrderService>();
    deliveryService = mock<DeliveryService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderService,
        },
        {
          provide: DeliveryService,
          useValue: deliveryService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const createOrderRequest: CreateOrderRequest = {
        items: [
          {
            productId: 'test-product-id',
            quantity: 2,
          },
        ],
      };

      orderService.create.mockResolvedValue(mockOrderResponse);

      const result = await controller.createOrder(mockUser, createOrderRequest);

      expect(orderService.create).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
      expect(result.data).toEqual(mockOrderResponse);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('getMyOrders', () => {
    it('should return a list of orders', async () => {
      const getOrdersRequest: GetOrdersRequest = {
        page: 1,
        limit: 10,
      };

      orderService.getOrdersByUser.mockResolvedValue({
        items: [mockOrderSummary],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await controller.getMyOrders(mockUser, getOrdersRequest);

      expect(orderService.getOrdersByUser).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe(mockOrderSummary.id);
      expect(result.success).toBe(true);
    });
  });

  describe('getOrderDetail', () => {
    it('should return order details', async () => {
      const orderId = 'test-order-id';

      orderService.getOrderDetail.mockResolvedValue(mockOrderResponse);

      const result = await controller.getOrderDetail(mockUser, orderId);

      expect(orderService.getOrderDetail).toHaveBeenCalledWith(orderId, mockUser.id);
      expect(result.data).toEqual(mockOrderResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const orderId = 'test-order-id';
      const cancelOrderRequest: CancelOrderRequest = {
        reason: '단순 변심',
      };

      const cancelledOrder = {
        ...mockOrderResponse,
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      };

      orderService.cancelOrder.mockResolvedValue(cancelledOrder);

      const result = await controller.cancelOrder(mockUser, orderId, cancelOrderRequest);

      expect(orderService.cancelOrder).toHaveBeenCalledWith(orderId, mockUser.id, cancelOrderRequest.reason);
      expect(result.data.status).toBe(OrderStatus.CANCELLED);
      expect(result.data.cancelledAt).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('getOrderDeliveries', () => {
    it('should return delivery information for an order', async () => {
      const orderId = 'test-order-id';

      deliveryService.findDeliveriesByOrderForViewer.mockResolvedValue(mockDeliveryResponse as any);

      const result = await controller.getOrderDeliveries(mockUser, orderId);

      expect(deliveryService.findDeliveriesByOrderForViewer).toHaveBeenCalledWith(orderId, mockUser.id);
      expect(result.success).toBe(true);
      expect(result.data.deliveries).toHaveLength(1);
      expect(result.data.deliveries[0].id).toBe('test-delivery-id');
      expect(result.data.deliveries[0].status).toBe(DeliveryStatus.SHIPPING);
      expect(result.data.deliveries[0].trackingNumber).toBe('1234567890');
      expect(result.data.deliveries[0].seller.name).toBe('테스트 판매자');
      expect(result.data.deliveries[0].orderItems).toHaveLength(1);
      expect(result.data.deliveries[0].orderItems[0].productName).toBe('테스트 상품');
    });
  });
});

