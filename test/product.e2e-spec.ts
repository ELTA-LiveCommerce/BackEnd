import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { ProductControllerModule } from '../src/api/product/product-controller.module';
import { JwtAuthGuard } from '../src/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/module/auth/guards/roles.guard';
import { ProductAttribute } from '../src/module/product/entity/product-attribute.entity';
import { Product } from '../src/module/product/entity/product.entity';
import { ProductStatus } from '../src/shared/enum/product-status.enum';
import { UserRole } from '../src/shared/enum/user-role.enum';

// 테스트용 JWT 토큰 생성 함수
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

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let mockProductRepository: any;
  let mockAttributeRepository: any;
  let mockEntityManager: any;
  let testToken: string;

  const mockSeller = {
    id: 'seller-id-1',
    email: 'seller@example.com',
    role: UserRole.SELLER,
  };

  const mockProduct = {
    id: 'product-id-1',
    name: '테스트 상품',
    description: '테스트 상품 설명',
    price: 10000,
    stockQuantity: 100,
    status: ProductStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    seller: mockSeller,
    attributes: {
      getItems: () => [],
      count: () => 0,
      add: jest.fn(),
      remove: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockProductRepository = {
      findAll: jest.fn().mockResolvedValue([mockProduct]),
      findOne: jest.fn().mockImplementation((criteria) => {
        if (criteria.id === 'product-id-1') {
          return Promise.resolve(mockProduct);
        }
        return Promise.resolve(null);
      }),
    };

    mockAttributeRepository = {
      findOne: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn().mockImplementation(async (entity) => {
        if (entity instanceof Product) {
          entity.id = 'product-id-1';
          return entity;
        }
        return entity;
      }),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ProductControllerModule],
    })
      .overrideProvider(getRepositoryToken(Product))
      .useValue(mockProductRepository)
      .overrideProvider(getRepositoryToken(ProductAttribute))
      .useValue(mockAttributeRepository)
      .overrideProvider(EntityManager)
      .useValue(mockEntityManager)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });

    testToken = generateTestToken(jwtService, mockSeller.id, mockSeller.email, mockSeller.role);

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/products (GET)', () => {
    it('should return all products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body).toHaveLength(1);
          expect(res.body[0].id).toEqual(mockProduct.id);
          expect(res.body[0].name).toEqual(mockProduct.name);
        });
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return a product by id', () => {
      return request(app.getHttpServer())
        .get('/products/product-id-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(mockProduct.id);
          expect(res.body.name).toEqual(mockProduct.name);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer()).get('/products/non-existent-id').expect(404);
    });
  });

  describe('/products (POST)', () => {
    it('should create new product', () => {
      const createProductDto = {
        name: '새 상품',
        description: '새 상품 설명',
        price: 15000,
        stockQuantity: 50,
      };

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${testToken}`)
        .send(createProductDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toEqual(createProductDto.name);
          expect(res.body.price).toEqual(createProductDto.price);
        });
    });
  });

  describe('/products/:id (PUT)', () => {
    it('should update product', () => {
      const updateProductDto = {
        name: '업데이트된 상품',
        price: 12000,
      };

      return request(app.getHttpServer())
        .put('/products/product-id-1')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateProductDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(mockProduct.id);
          expect(res.body.name).toEqual(updateProductDto.name);
          expect(res.body.price).toEqual(updateProductDto.price);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .put('/products/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: '업데이트된 상품' })
        .expect(404);
    });
  });

  describe('/products/:id (DELETE)', () => {
    it('should delete product', () => {
      return request(app.getHttpServer())
        .delete('/products/product-id-1')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/products/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });
});
