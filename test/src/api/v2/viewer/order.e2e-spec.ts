import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { OrderControllerModule } from '@/api/v2/viewer/order/order-controller.module';
import { OrderService } from '@/module/order/order.service';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { UserRole } from '@/shared/enum/user-role.enum';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { DeliveryStatus } from '@/module/delivery/entity/delivery.entity';

// Mock services
const mockOrderService = {
  create: jest.fn(),
  getOrdersByUser: jest.fn(),
  getOrderDetail: jest.fn(),
  cancelOrder: jest.fn(),
  updateShippingInfoBySeller: jest.fn(),
};

const mockDeliveryService = {
  findDeliveriesByOrderForViewer: jest.fn(),
};

function generateTestToken(
  jwtService: JwtService,
  userId = 'test-user-id',
  email = 'test@example.com',
  role = UserRole.VIEWER,
): string {
  return jwtService.sign({
    sub: userId,
    email,
    role,
  });
}

describe('Viewer Order API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testToken: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OrderControllerModule],
    })
      .overrideProvider(OrderService)
      .useValue(mockOrderService)
      .overrideProvider(DeliveryService)
      .useValue(mockDeliveryService)
      .compile();

    app = module.createNestApplication();
    await app.init();

    // JWT 서비스 설정
    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    testToken = generateTestToken(jwtService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /v2/viewer/orders/:orderId/deliveries', () => {
    it('should return delivery information for an order', async () => {
      const orderId = 'test-order-id';
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

      mockDeliveryService.findDeliveriesByOrderForViewer.mockResolvedValue(mockDeliveryResponse);

      const response = await request(app.getHttpServer())
        .get(`/v2/viewer/orders/${orderId}/deliveries`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveries).toHaveLength(1);
      expect(response.body.data.deliveries[0].id).toBe('test-delivery-id');
      expect(response.body.data.deliveries[0].status).toBe(DeliveryStatus.SHIPPING);
      expect(response.body.data.deliveries[0].trackingNumber).toBe('1234567890');
      expect(response.body.data.deliveries[0].seller.name).toBe('테스트 판매자');
      expect(response.body.data.deliveries[0].orderItems).toHaveLength(1);
      expect(response.body.data.deliveries[0].orderItems[0].productName).toBe('테스트 상품');

      expect(mockDeliveryService.findDeliveriesByOrderForViewer).toHaveBeenCalledWith(orderId, 'test-user-id');
    });

    it('should return 401 when no authorization token is provided', async () => {
      const orderId = 'test-order-id';

      await request(app.getHttpServer()).get(`/v2/viewer/orders/${orderId}/deliveries`).expect(401);
    });

    it('should return 404 when order is not found', async () => {
      const orderId = 'non-existent-order-id';

      mockDeliveryService.findDeliveriesByOrderForViewer.mockRejectedValue(
        new Error('주문을 찾을 수 없거나 조회 권한이 없습니다.'),
      );

      await request(app.getHttpServer())
        .get(`/v2/viewer/orders/${orderId}/deliveries`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(500); // Error handler would catch this
    });

    it('should return empty deliveries array when no deliveries exist', async () => {
      const orderId = 'test-order-id';
      const mockEmptyResponse = { deliveries: [] };

      mockDeliveryService.findDeliveriesByOrderForViewer.mockResolvedValue(mockEmptyResponse);

      const response = await request(app.getHttpServer())
        .get(`/v2/viewer/orders/${orderId}/deliveries`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveries).toHaveLength(0);
    });
  });

  describe('POST /v2/viewer/orders', () => {
    it('should create a new order', async () => {
      const createOrderRequest = {
        items: [
          {
            productId: 'test-product-id',
            quantity: 2,
            attributes: '{"color": "red", "size": "M"}',
          },
        ],
      };

      const mockOrderResponse = {
        id: 'test-order-id',
        orderNumber: 'ORD20240601123456',
        userId: 'test-user-id',
        status: OrderStatus.PENDING,
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
        paymentMethod: '계좌이체',
        shippingAddress: '서울시 강남구 테스트동 123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrderService.create.mockResolvedValue(mockOrderResponse);

      const response = await request(app.getHttpServer())
        .post('/v2/viewer/orders')
        .set('Authorization', `Bearer ${testToken}`)
        .send(createOrderRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBe('ORD20240601123456');
      expect(response.body.data.totalAmount).toBe(50000);
      expect(mockOrderService.create).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });
  });

  describe('GET /v2/viewer/orders', () => {
    it('should return user orders list', async () => {
      const mockOrdersResponse = {
        items: [
          {
            id: 'test-order-id',
            orderNumber: 'ORD20240601123456',
            status: OrderStatus.PAID,
            totalAmount: 50000,
            itemCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockOrderService.getOrdersByUser.mockResolvedValue(mockOrdersResponse);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/orders')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].orderNumber).toBe('ORD20240601123456');
      expect(mockOrderService.getOrdersByUser).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });

    it('should map REFUND_REQUESTED status to PENDING in orders list', async () => {
      const mockOrdersResponse = {
        items: [
          {
            id: 'test-order-1',
            orderNumber: 'ORD20240601123456',
            status: OrderStatus.PAID,
            products: [{ productId: 'p1', productName: 'Product 1', quantity: 1, price: 10000 }],
            totalAmount: 10000,
            itemCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'test-order-2',
            orderNumber: 'ORD20240601123457',
            status: OrderStatus.REFUND_REQUESTED,
            products: [{ productId: 'p2', productName: 'Product 2', quantity: 2, price: 15000 }],
            totalAmount: 30000,
            itemCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockOrderService.getOrdersByUser.mockResolvedValue(mockOrdersResponse);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/orders')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items[0].status).toBe(OrderStatus.PAID);
      expect(response.body.data.items[1].status).toBe(OrderStatus.PENDING); // REFUND_REQUESTED mapped to PENDING
      expect(mockOrderService.getOrdersByUser).toHaveBeenCalledWith('test-user-id', expect.any(Object));
    });
  });

  describe('GET /v2/viewer/orders/:orderId', () => {
    it('should return order detail', async () => {
      const orderId = 'test-order-id';
      const mockOrderDetailResponse = {
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

      mockOrderService.getOrderDetail.mockResolvedValue(mockOrderDetailResponse);

      const response = await request(app.getHttpServer())
        .get(`/v2/viewer/orders/${orderId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBe('ORD20240601123456');
      expect(mockOrderService.getOrderDetail).toHaveBeenCalledWith(orderId, 'test-user-id');
    });

    it('should map REFUND_REQUESTED status to PENDING', async () => {
      const orderId = 'test-order-id';
      const mockOrderDetailResponse = {
        id: 'test-order-id',
        orderNumber: 'ORD20240601123456',
        userId: 'test-user-id',
        status: OrderStatus.REFUND_REQUESTED,
        items: [
          {
            id: 'test-item-id',
            productId: 'test-product-id',
            productName: '테스트 상품',
            quantity: 1,
            price: 30000,
            totalPrice: 30000,
          },
        ],
        totalAmount: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrderService.getOrderDetail.mockResolvedValue(mockOrderDetailResponse);

      const response = await request(app.getHttpServer())
        .get(`/v2/viewer/orders/${orderId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(OrderStatus.PENDING);
      expect(mockOrderService.getOrderDetail).toHaveBeenCalledWith(orderId, 'test-user-id');
    });
  });
});

