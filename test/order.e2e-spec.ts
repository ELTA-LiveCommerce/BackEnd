import { EntityManager } from '@mikro-orm/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

import { UpdateShippingDto } from '@/module/order/dto/update-shipping.dto';
import { Order } from '@/module/order/entity/order.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { UserRole } from '@/shared/enum/user-role.enum';
import { HttpExceptionFilter } from '@/shared/filter';

import { generateTestToken } from './helpers/auth.helper';
import { setupTestApp, cleanupTestApp } from './helpers/test-db.helper';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let viewerToken: string;
  let sellerToken: string;
  let entityManager: EntityManager;

  // 테스트용 데이터
  const testUser = {
    id: 'test-user-id',
    email: 'user@example.com',
    role: UserRole.VIEWER,
  };

  const testSeller = {
    id: 'test-seller-id',
    email: 'seller@example.com',
    role: UserRole.SELLER,
  };

  const testProduct = {
    id: 'test-product-id',
    name: '테스트 상품',
    price: 10000,
    stockQuantity: 100,
    sellerId: 'test-seller-id',
  };

  const testOrder = {
    id: 'test-order-id',
    orderNumber: 'ORD-230101-1234',
    user: testUser,
    status: OrderStatus.PENDING,
    totalAmount: 10000,
    items: [
      {
        id: 'test-order-item-id',
        product: testProduct,
        quantity: 1,
        price: 10000,
        totalPrice: 10000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 모킹 함수들
  const mockFindOne = jest.fn();
  const mockPersistAndFlush = jest.fn();
  const mockAssign = jest.fn();
  const mockRemoveAndFlush = jest.fn();
  const mockFlush = jest.fn();
  const mockFind = jest.fn();

  beforeAll(async () => {
    // 테스트 앱 설정
    const { app: testApp, em } = await setupTestApp();
    app = testApp;
    entityManager = em;

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    jwtService = app.get(JwtService);

    // entityManager 메서드 모킹
    entityManager.findOne = mockFindOne;
    entityManager.persistAndFlush = mockPersistAndFlush;
    entityManager.assign = mockAssign;
    entityManager.removeAndFlush = mockRemoveAndFlush;
    entityManager.flush = mockFlush;
    entityManager.find = mockFind;

    // 테스트 토큰 생성
    viewerToken = generateTestToken(jwtService, testUser.id, testUser.email, testUser.role);
    sellerToken = generateTestToken(jwtService, testSeller.id, testSeller.email, testSeller.role);
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  // 주문 생성 테스트
  describe('/orders (POST)', () => {
    it('인증된 사용자는 주문을 생성할 수 있어야 함', () => {
      // 상품 조회 모킹
      mockFindOne.mockImplementationOnce(() => testProduct);
      // 사용자 조회 모킹
      mockFindOne.mockImplementationOnce(() => testUser);
      // 주문 생성 모킹
      mockPersistAndFlush.mockImplementationOnce(() => Promise.resolve());

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          items: [
            {
              productId: testProduct.id,
              quantity: 1,
            },
          ],
          shippingAddress: '서울시 강남구',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('orderNumber');
          expect(res.body.status).toBe(OrderStatus.PENDING);
        });
    });

    it('인증되지 않은 사용자는 401 에러를 받아야 함', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          items: [
            {
              productId: testProduct.id,
              quantity: 1,
            },
          ],
        })
        .expect(401);
    });
  });

  // 주문 목록 조회 테스트
  describe('/orders (GET)', () => {
    it('사용자는 자신의 주문 목록을 조회할 수 있어야 함', () => {
      // 주문 목록 조회 모킹
      mockFind.mockImplementationOnce(() => [testOrder]);
      mockFind.mockImplementationOnce(() => [testOrder]); // 카운트용

      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body.items).toBeInstanceOf(Array);
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
        });
    });
  });

  // 주문 상세 조회 테스트
  describe('/orders/:id (GET)', () => {
    it('사용자는 자신의 주문 상세 정보를 조회할 수 있어야 함', () => {
      // 주문 조회 모킹
      mockFindOne.mockImplementationOnce(() => ({
        ...testOrder,
        items: {
          getItems: () => testOrder.items,
        },
      }));

      return request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testOrder.id);
          expect(res.body).toHaveProperty('items');
          expect(res.body.items).toBeInstanceOf(Array);
        });
    });

    it('존재하지 않는 주문을 조회하면 404 에러를 반환해야 함', () => {
      // 주문이 없는 경우 모킹
      mockFindOne.mockImplementationOnce(() => null);

      return request(app.getHttpServer())
        .get('/orders/non-existent-id')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(404);
    });
  });

  // 주문 취소 테스트
  describe('/orders/:id/cancel (POST)', () => {
    it('사용자는 자신의 주문을 취소할 수 있어야 함', () => {
      // 취소 가능한 주문 상태로 모킹
      mockFindOne.mockImplementationOnce(() => ({
        ...testOrder,
        status: OrderStatus.PENDING,
        items: {
          getItems: () => [
            {
              ...testOrder.items[0],
              product: { ...testProduct },
            },
          ],
        },
      }));

      // 상품 재고 증가 및 주문 취소 모킹
      mockFindOne.mockImplementationOnce(() => testProduct);
      mockAssign.mockImplementationOnce((_, updates) => ({
        ...testProduct,
        ...updates,
      }));
      mockFlush.mockImplementationOnce(() => Promise.resolve());

      return request(app.getHttpServer())
        .post(`/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ reason: '단순 변심' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testOrder.id);
          expect(res.body).toHaveProperty('status', OrderStatus.CANCELLED);
        });
    });

    it('이미 배송 중인 주문은 취소할 수 없어야 함', () => {
      // 배송 중인 주문으로 모킹
      mockFindOne.mockImplementationOnce(() => ({
        ...testOrder,
        status: OrderStatus.SHIPPED,
      }));

      return request(app.getHttpServer())
        .post(`/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ reason: '단순 변심' })
        .expect(400);
    });
  });

  // 배송 정보 수정 테스트
  describe('/orders/:orderId/shipping-info (PATCH)', () => {
    let orderForShippingTest: any;
    const sellerUserForTest = {
      id: testSeller.id,
    };
    const productSoldBySeller = {
      ...testProduct,
      id: 'product-sold-by-seller',
      seller: sellerUserForTest,
    };

    beforeEach(() => {
      orderForShippingTest = {
        id: `order-ship-${Date.now()}`,
        user: testUser,
        orderNumber: `ORD-SHIP-${Date.now()}`,
        status: OrderStatus.PAID,
        items: {
          getItems: () => [
            {
              id: 'item-for-shipping',
              product: productSoldBySeller,
              quantity: 1,
              price: productSoldBySeller.price,
              totalPrice: productSoldBySeller.price,
            },
          ],
          add: jest.fn(),
          length: 1,
        },
        totalAmount: productSoldBySeller.price,
        shippingCode: null,
        shippedAt: null,
        notes: '배송 전 메모',
        createdAt: new Date(),
        updatedAt: new Date(),
        paidAt: new Date(),
      };

      mockFindOne.mockImplementation((entity, conditions, options) => {
        if (entity === Order && conditions?.id === orderForShippingTest.id) {
          const populatedOrder = { ...orderForShippingTest };
          // 실제 populate 로직을 단순화하여 seller 정보를 보장
          if (options?.populate?.includes('items.product.seller')) {
            populatedOrder.items = {
              ...populatedOrder.items,
              getItems: () =>
                populatedOrder.items.getItems().map((item: any) => ({
                  ...item,
                  product: {
                    ...item.product,
                    seller: productSoldBySeller.seller, // seller 정보 주입
                  },
                })),
            };
          }
          return populatedOrder;
        }
        return null;
      });

      mockAssign.mockImplementation((target, source) => {
        return { ...target, ...source };
      });

      mockFlush.mockResolvedValue(undefined);
    });

    it('판매자는 자신의 주문 상품 배송 정보를 성공적으로 업데이트해야 함 (200 OK)', async () => {
      const shippingDto: UpdateShippingDto = {
        shippingCode: 'NEW_TRACKING_123',
        status: OrderStatus.SHIPPED,
        shippingMemo: '오늘 발송 완료',
      };

      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderForShippingTest.id}/shipping-info`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(shippingDto)
        .expect(200);

      expect(response.body.id).toBe(orderForShippingTest.id);
      expect(response.body.shippingCode).toBe(shippingDto.shippingCode);
      expect(response.body.status).toBe(OrderStatus.SHIPPED);
      expect(response.body.shippedAt).toBeDefined();
      expect(response.body.notes).toContain(shippingDto.shippingMemo);
    });

    it('구매자가 배송 정보 업데이트 시도 시 403 Forbidden 에러 발생', async () => {
      const shippingDto: UpdateShippingDto = { shippingCode: 'TRY_TRACKING_456' };
      await request(app.getHttpServer())
        .patch(`/orders/${orderForShippingTest.id}/shipping-info`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(shippingDto)
        .expect(403);
    });

    it('다른 판매자가 배송 정보 업데이트 시도 시 403 Forbidden 에러 발생', async () => {
      const otherSellerToken = generateTestToken(
        jwtService,
        'other-seller-id-for-test',
        'other@seller.com',
        UserRole.SELLER,
      );
      const shippingDto: UpdateShippingDto = { shippingCode: 'OTHER_TRACKING_789' };

      await request(app.getHttpServer())
        .patch(`/orders/${orderForShippingTest.id}/shipping-info`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .send(shippingDto)
        .expect(403);
    });

    it('존재하지 않는 주문 ID로 요청 시 404 Not Found 에러 발생', async () => {
      const shippingDto: UpdateShippingDto = { shippingCode: 'NON_EXISTENT_ORDER' };
      mockFindOne.mockReturnValueOnce(null);

      await request(app.getHttpServer())
        .patch(`/orders/non-existent-order-id/shipping-info`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(shippingDto)
        .expect(404);
    });

    it('이미 배송 완료된 주문에 대해 업데이트 시도 시 400 Bad Request 에러 발생', async () => {
      const deliveredOrder = { ...orderForShippingTest, status: OrderStatus.DELIVERED };
      mockFindOne.mockReturnValueOnce(deliveredOrder);

      const shippingDto: UpdateShippingDto = { shippingCode: 'ALREADY_DELIVERED' };
      await request(app.getHttpServer())
        .patch(`/orders/${orderForShippingTest.id}/shipping-info`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(shippingDto)
        .expect(400);
    });

    it('필수 항목(shippingCode) 없이 요청 시 400 Bad Request 에러 발생', async () => {
      const invalidShippingDto = { status: OrderStatus.SHIPPED, shippingMemo: '메모만 있음' } as UpdateShippingDto;
      await request(app.getHttpServer())
        .patch(`/orders/${orderForShippingTest.id}/shipping-info`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidShippingDto)
        .expect(400);
    });
  });
});
