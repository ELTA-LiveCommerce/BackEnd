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

describe('ProductAttributeController (e2e)', () => {
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
    price: 10000,
    status: ProductStatus.ACTIVE,
    seller: mockSeller,
  };

  const mockAttributes = [
    {
      id: 'attr-id-1',
      name: '모델명',
      value: 'Galaxy S23',
      sortOrder: 0,
      isVisible: true,
      product: mockProduct,
    },
    {
      id: 'attr-id-2',
      name: '브랜드',
      value: 'Samsung',
      sortOrder: 1,
      isVisible: true,
      product: mockProduct,
    },
  ];

  beforeEach(async () => {
    mockProductRepository = {
      findOne: jest.fn().mockImplementation((criteria) => {
        if (criteria.id === 'product-id-1') {
          return Promise.resolve(mockProduct);
        }
        return Promise.resolve(null);
      }),
    };

    mockAttributeRepository = {
      find: jest.fn().mockResolvedValue(mockAttributes),
      findOne: jest.fn().mockImplementation((criteria) => {
        if (criteria.id === 'attr-id-1') {
          return Promise.resolve(mockAttributes[0]);
        }
        if (criteria.id === 'attr-id-2') {
          return Promise.resolve(mockAttributes[1]);
        }
        return Promise.resolve(null);
      }),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn().mockImplementation(async (entity) => {
        if (entity instanceof ProductAttribute) {
          entity.id = 'attr-id-new';
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

  describe('/products/:productId/attributes (GET)', () => {
    it('should return all attributes for product', () => {
      return request(app.getHttpServer())
        .get('/products/product-id-1/attributes')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body).toHaveLength(2);
          expect(res.body[0].id).toEqual(mockAttributes[0].id);
          expect(res.body[0].name).toEqual(mockAttributes[0].name);
          expect(res.body[1].id).toEqual(mockAttributes[1].id);
          expect(res.body[1].name).toEqual(mockAttributes[1].name);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer()).get('/products/non-existent-id/attributes').expect(404);
    });
  });

  describe('/products/:productId/attributes/:id (GET)', () => {
    it('should return attribute by id', () => {
      return request(app.getHttpServer())
        .get('/products/product-id-1/attributes/attr-id-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(mockAttributes[0].id);
          expect(res.body.name).toEqual(mockAttributes[0].name);
          expect(res.body.value).toEqual(mockAttributes[0].value);
        });
    });

    it('should return 404 for non-existent attribute', () => {
      return request(app.getHttpServer()).get('/products/product-id-1/attributes/non-existent-id').expect(404);
    });
  });

  describe('/products/:productId/attributes (POST)', () => {
    it('should create new attribute', () => {
      const createAttributeDto = {
        name: '색상',
        value: '블랙',
        sortOrder: 2,
        isVisible: true,
      };

      return request(app.getHttpServer())
        .post('/products/product-id-1/attributes')
        .set('Authorization', `Bearer ${testToken}`)
        .send(createAttributeDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toEqual(createAttributeDto.name);
          expect(res.body.value).toEqual(createAttributeDto.value);
          expect(res.body.sortOrder).toEqual(createAttributeDto.sortOrder);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .post('/products/non-existent-id/attributes')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: '색상', value: '블랙' })
        .expect(404);
    });
  });

  describe('/products/:productId/attributes/:id (PUT)', () => {
    it('should update attribute', () => {
      const updateAttributeDto = {
        value: '갤럭시 S23 Ultra',
        isVisible: false,
      };

      return request(app.getHttpServer())
        .put('/products/product-id-1/attributes/attr-id-1')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateAttributeDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(mockAttributes[0].id);
          expect(res.body.value).toEqual(updateAttributeDto.value);
          expect(res.body.isVisible).toEqual(updateAttributeDto.isVisible);
        });
    });

    it('should return 404 for non-existent attribute', () => {
      return request(app.getHttpServer())
        .put('/products/product-id-1/attributes/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ value: '갤럭시 S23 Ultra' })
        .expect(404);
    });
  });

  describe('/products/:productId/attributes/:id (DELETE)', () => {
    it('should delete attribute', () => {
      return request(app.getHttpServer())
        .delete('/products/product-id-1/attributes/attr-id-1')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent attribute', () => {
      return request(app.getHttpServer())
        .delete('/products/product-id-1/attributes/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('/products/:productId/attributes/bulk (POST)', () => {
    it('should create multiple attributes', () => {
      const attributeDtos = [
        { name: '색상', value: '블랙' },
        { name: '저장용량', value: '256GB' },
      ];

      return request(app.getHttpServer())
        .post('/products/product-id-1/attributes/bulk')
        .set('Authorization', `Bearer ${testToken}`)
        .send(attributeDtos)
        .expect(201)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .post('/products/non-existent-id/attributes/bulk')
        .set('Authorization', `Bearer ${testToken}`)
        .send([{ name: '색상', value: '블랙' }])
        .expect(404);
    });
  });
});
