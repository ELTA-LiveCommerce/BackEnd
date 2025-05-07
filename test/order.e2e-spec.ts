import { getRepositoryToken } from '@mikro-orm/nestjs';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { OrderControllerModule } from '@/api/order/order-controller.module';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { Order } from '@/module/order/entity/order.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { UserRole } from '@/shared/enum/user-role.enum';
import { HttpExceptionFilter } from '@/shared/filter';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let viewerToken: string;
  let sellerToken: string;

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

  // 모킹 리포지토리
  const mockProductRepository = {
    findOne: jest.fn().mockImplementation((where) => {
      if (where?.id === testProduct.id) {
        return testProduct;
      }
      return null;
    }),
  };

  const mockUserRepository = {
    findOne: jest.fn().mockImplementation((where) => {
      if (where?.id === testUser.id) {
        return testUser;
      } else if (where?.id === testSeller.id) {
        return testSeller;
      }
      return null;
    }),
  };

  const mockOrderRepository = {
    findOne: jest.fn().mockImplementation((where) => {
      if (where?.id === testOrder.id && where?.user?.id === testUser.id) {
        return testOrder;
      }
      return null;
    }),
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getResult: jest.fn().mockResolvedValue([testOrder]),
    clone: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue(1),
  };

  const mockOrderItemRepository = {
    count: jest.fn().mockResolvedValue(1),
  };

  // JWT 토큰 생성 함수
  function generateTestToken(userId: string, email: string, role: UserRole): string {
    return jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrderControllerModule],
    })
      .overrideProvider(getRepositoryToken(Product))
      .useValue(mockProductRepository)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .overrideProvider(getRepositoryToken(Order))
      .useValue(mockOrderRepository)
      .overrideProvider(getRepositoryToken(OrderItem))
      .useValue(mockOrderItemRepository)
      .compile();

    app = moduleFixture.createNestApplication();

    // 전역 파이프 및 필터 설정
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

    // JWT 서비스 설정
    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });

    // 테스트 토큰 생성
    viewerToken = generateTestToken(testUser.id, testUser.email, testUser.role);
    sellerToken = generateTestToken(testSeller.id, testSeller.email, testSeller.role);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/orders (POST)', () => {
    it('인증된 사용자는 주문을 생성할 수 있어야 함', () => {
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

  describe('/orders (GET)', () => {
    it('사용자는 자신의 주문 목록을 조회할 수 있어야 함', () => {
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

  describe('/orders/:id (GET)', () => {
    it('사용자는 자신의 주문 상세 정보를 조회할 수 있어야 함', () => {
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
      return request(app.getHttpServer())
        .get('/orders/non-existent-id')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(404);
    });
  });

  describe('/orders/:id/cancel (POST)', () => {
    it('사용자는 자신의 주문을 취소할 수 있어야 함', () => {
      // 취소 가능한 주문 상태로 모킹
      mockOrderRepository.findOne.mockImplementationOnce(() => ({
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
      mockOrderRepository.findOne.mockImplementationOnce(() => ({
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
});
