import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';

import { CartController } from '@/api/v2/viewer/cart/cart.controller';
import { CartService } from '@/module/cart/cart.service';
import { Cart } from '@/module/cart/entity/cart.entity';
import { CartItem } from '@/module/cart/entity/cart-item.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('CartController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testToken: string;

  // 모킹된 서비스와 리포지토리
  let cartServiceMock: any;
  let cartRepositoryMock: any;
  let cartItemRepositoryMock: any;
  let productRepositoryMock: any;
  let entityManagerMock: any;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    role: UserRole.VIEWER,
  };

  const mockProduct = {
    id: 'product-id-1',
    name: '테스트 상품',
    price: 10000,
    stockQuantity: 10,
    mainImage: 'image.jpg',
  };

  const mockCartItem = {
    id: 'cart-item-id-1',
    product: mockProduct,
    quantity: 2,
  };

  const mockCart = {
    id: 'cart-id-1',
    user: mockUser,
    items: {
      getItems: jest.fn().mockReturnValue([mockCartItem]),
      add: jest.fn(),
      removeAll: jest.fn(),
    },
  };

  const mockCartResponse = {
    id: 'cart-id-1',
    items: [
      {
        id: 'cart-item-id-1',
        productId: 'product-id-1',
        productName: '테스트 상품',
        productImageUrl: 'image.jpg',
        price: 10000,
        quantity: 2,
        totalPrice: 20000,
      },
    ],
    totalItems: 2,
    totalPrice: 20000,
  };

  // JWT 토큰 생성 함수
  function generateTestToken(userId = 'user-id-1', email = 'test@example.com', role = UserRole.VIEWER): string {
    return jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }

  beforeEach(async () => {
    // 모킹 설정
    cartServiceMock = {
      getCart: jest.fn().mockResolvedValue(mockCart),
      addToCart: jest.fn().mockResolvedValue(mockCart),
      updateCartItem: jest.fn().mockResolvedValue(mockCart),
      removeFromCart: jest.fn().mockResolvedValue(mockCart),
      clearCart: jest.fn().mockResolvedValue({}),
    };

    cartRepositoryMock = {
      findOne: jest.fn(),
    };

    cartItemRepositoryMock = {
      findOne: jest.fn(),
    };

    productRepositoryMock = {
      findOne: jest.fn(),
    };

    entityManagerMock = {
      getReference: jest.fn(),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    // 테스트 모듈 설정
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: cartServiceMock,
        },
        {
          provide: getRepositoryToken(Cart),
          useValue: cartRepositoryMock,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: cartItemRepositoryMock,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // JWT 서비스 및 토큰 설정
    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    testToken = generateTestToken();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /v2/viewer/cart', () => {
    it('인증된 사용자의 장바구니를 반환해야 함', () => {
      return supertest(app.getHttpServer())
        .get('/v2/viewer/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200)
        .expect((res) => {
          expect(cartServiceMock.getCart).toHaveBeenCalled();
        });
    });

    it('인증되지 않은 요청은 401 에러를 반환해야 함', () => {
      return supertest(app.getHttpServer()).get('/v2/viewer/cart').expect(401);
    });
  });

  describe('POST /v2/viewer/cart', () => {
    it('장바구니에 상품을 추가해야 함', () => {
      const dto = {
        productId: 'product-id-1',
        quantity: 2,
      };

      return supertest(app.getHttpServer())
        .post('/v2/viewer/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(cartServiceMock.addToCart).toHaveBeenCalledWith(mockUser.id, dto.productId, dto.quantity);
        });
    });

    it('유효하지 않은 입력에 대해 400 에러를 반환해야 함', () => {
      const invalidDto = {
        productId: 'product-id-1',
        quantity: -1, // 음수 수량 - 유효하지 않음
      };

      return supertest(app.getHttpServer())
        .post('/v2/viewer/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('PUT /v2/viewer/cart', () => {
    it('장바구니 상품 수량을 변경해야 함', () => {
      const dto = {
        productId: 'product-id-1',
        quantity: 5,
      };

      return supertest(app.getHttpServer())
        .put('/v2/viewer/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send(dto)
        .expect(200)
        .expect((res) => {
          expect(cartServiceMock.updateCartItem).toHaveBeenCalledWith(mockUser.id, dto.productId, dto.quantity);
        });
    });
  });

  describe('DELETE /v2/viewer/cart/item/:productId', () => {
    it('장바구니에서 상품을 삭제해야 함', () => {
      const productId = 'product-id-1';

      return supertest(app.getHttpServer())
        .delete(`/v2/viewer/cart/item/${productId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200)
        .expect((res) => {
          expect(cartServiceMock.removeFromCart).toHaveBeenCalledWith(mockUser.id, productId);
        });
    });
  });

  describe('DELETE /v2/viewer/cart', () => {
    it('장바구니를 비워야 함', () => {
      return supertest(app.getHttpServer())
        .delete('/v2/viewer/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(204)
        .expect((res) => {
          expect(cartServiceMock.clearCart).toHaveBeenCalledWith(mockUser.id);
        });
    });
  });
});

