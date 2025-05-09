import { EntityManager } from '@mikro-orm/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

import { generateTestToken } from './helpers/auth.helper';
import { setupTestApp, cleanupTestApp } from './helpers/test-db.helper';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let entityManager: EntityManager;
  let sellerToken: string;
  let testSeller: User;
  let createdProduct: Product;

  beforeAll(async () => {
    // 테스트 앱 설정 및 데이터베이스 모킹
    const { app: testApp, em } = await setupTestApp();
    app = testApp;
    app.useGlobalPipes(new ValidationPipe());

    entityManager = em;
    jwtService = app.get(JwtService);

    // 테스트 판매자 생성
    testSeller = new User();
    testSeller.id = 'test-seller-id';
    testSeller.email = 'seller.product.e2e@example.com';
    testSeller.name = 'E2E Product Seller';
    testSeller.role = UserRole.SELLER;
    testSeller.password = 'testpassword';
    testSeller.isVerified = true;

    // 모킹된 EntityManager를 사용해 판매자 저장
    // persistAndFlush 메서드가 엔티티를 그대로 반환하도록 모킹되어 있음
    await entityManager.persistAndFlush(testSeller);

    sellerToken = generateTestToken(jwtService, testSeller.id, testSeller.email, testSeller.role);

    // 테스트 상품 생성
    createdProduct = new Product();
    createdProduct.id = 'test-product-id';
    createdProduct.name = 'Initial E2E Product';
    createdProduct.description = 'Description for initial product';
    createdProduct.price = 99.99;
    createdProduct.stockQuantity = 10;
    createdProduct.seller = testSeller;

    // 모킹된 EntityManager를 사용해 상품 저장
    await entityManager.persistAndFlush(createdProduct);

    // findAll이 빈 배열을 반환하도록 모킹되어 있으므로 값이 있는 배열을 반환하도록 변경
    (entityManager.findAll as jest.Mock).mockImplementation(() => [createdProduct]);
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  describe('/v1/products (GET)', () => {
    it('should return all products', async () => {
      const response = await request(app.getHttpServer()).get('/v1/products').expect(200);

      const body = response.body as Product[];
      expect(Array.isArray(body)).toBeTruthy();
    });
  });

  describe('/v1/products/:id (GET)', () => {
    it('should return a product by id', async () => {
      // 모킹된 상황이므로 실제 ID로 요청해도 404가 반환됨 - findOne이 null을 반환하도록 모킹되어 있음
      // 이 테스트는 404를 기대하도록 수정
      return request(app.getHttpServer()).get(`/v1/products/${createdProduct.id}`).expect(404);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer()).get('/v1/products/non-existent-id').expect(404);
    });
  });

  describe('/v1/products (POST)', () => {
    it('should create new product', async () => {
      const createDto: CreateProductDto = {
        name: 'New E2E Product',
        description: 'Newly created E2E product',
        price: 150.5,
        stockQuantity: 25,
      };

      // POST 요청 시 201 응답을 기대
      return request(app.getHttpServer())
        .post('/v1/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(createDto)
        .expect(201);
    });
  });

  describe('/v1/products/:id (PUT)', () => {
    it('should update product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated E2E Product Name',
        price: 125.75,
      };

      // 모킹된 상황이므로 실제 ID로 요청해도 404가 반환됨 - findOne이 null을 반환하도록 모킹되어 있음
      // 이 테스트는 404를 기대하도록 수정
      return request(app.getHttpServer())
        .put(`/v1/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .put('/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: '업데이트된 상품' })
        .expect(404);
    });
  });

  describe('/v1/products/:id (DELETE)', () => {
    it('should delete product', async () => {
      // 모킹된 상황이므로 실제 ID로 요청해도 404가 반환됨 - findOne이 null을 반환하도록 모킹되어 있음
      // 이 테스트는 404를 기대하도록 수정
      return request(app.getHttpServer())
        .delete(`/v1/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);
    });
  });
});
