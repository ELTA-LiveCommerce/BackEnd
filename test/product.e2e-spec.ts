import { EntityManager } from '@mikro-orm/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateProductDto } from '@/module/product/dto/create-product.dto';
import { UpdateProductDto } from '@/module/product/dto/update-product.dto';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { ProductStatus } from '@/shared/enum/product-status.enum';
import { UserRole } from '@/shared/enum/user-role.enum';

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
  let entityManager: EntityManager | undefined;
  let sellerToken: string;
  let testSeller: User;
  let createdProduct: Product;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    entityManager = app.get(EntityManager);
    jwtService = app.get(JwtService);

    if (!entityManager) throw new Error('EntityManager not initialized');

    testSeller = new User();
    testSeller.email = 'seller.product.e2e@example.com';
    testSeller.name = 'E2E Product Seller';
    testSeller.role = UserRole.SELLER;
    testSeller.password = 'testpassword';
    testSeller.isVerified = true;
    await entityManager.persistAndFlush(testSeller);

    sellerToken = generateTestToken(jwtService, testSeller.id, testSeller.email, testSeller.role);

    createdProduct = new Product();
    createdProduct.name = 'Initial E2E Product';
    createdProduct.description = 'Description for initial product';
    createdProduct.price = 99.99;
    createdProduct.stockQuantity = 10;
    createdProduct.status = ProductStatus.ACTIVE;
    createdProduct.seller = testSeller;
    await entityManager.persistAndFlush(createdProduct);
  });

  afterAll(async () => {
    if (entityManager && typeof entityManager.getUnitOfWork === 'function') {
      if (createdProduct && createdProduct.id) {
        const productToDelete = await entityManager.findOne(Product, { id: createdProduct.id });
        if (productToDelete) await entityManager.removeAndFlush(productToDelete);
      }
      if (testSeller && testSeller.id) {
        const userToDelete = await entityManager.findOne(User, { id: testSeller.id });
        if (userToDelete) await entityManager.removeAndFlush(userToDelete);
      }
    }
    if (app) await app.close();
  });

  describe('/products (GET)', () => {
    it('should return all products', async () => {
      const response = await request(app.getHttpServer()).get('/products').expect(200);

      const body = response.body as Product[];
      expect(Array.isArray(body)).toBeTruthy();
      expect(body.length).toBeGreaterThanOrEqual(1);
      const found = body.find((p) => p.id === createdProduct.id);
      expect(found).toBeDefined();
      if (found) expect(found.name).toEqual(createdProduct.name);
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return a product by id', async () => {
      const response = await request(app.getHttpServer()).get(`/products/${createdProduct.id}`).expect(200);
      const body = response.body as Product;
      expect(body.id).toEqual(createdProduct.id);
      expect(body.name).toEqual(createdProduct.name);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer()).get('/products/non-existent-id').expect(404);
    });
  });

  describe('/products (POST)', () => {
    let newProductId: string;
    it('should create new product', async () => {
      if (!entityManager) throw new Error('EntityManager not initialized for POST test');
      const createDto: CreateProductDto = {
        name: 'New E2E Product',
        description: 'Newly created E2E product',
        price: 150.5,
        stockQuantity: 25,
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(createDto)
        .expect(201);

      const body = response.body as Product;
      expect(body.id).toBeDefined();
      newProductId = body.id;
      expect(body.name).toEqual(createDto.name);
      expect(body.price).toEqual(createDto.price);
      expect(body.seller?.id).toEqual(testSeller.id);
    });

    afterAll(async () => {
      if (newProductId && entityManager && typeof entityManager.getUnitOfWork === 'function') {
        const productToDelete = await entityManager.findOne(Product, { id: newProductId });
        if (productToDelete) await entityManager.removeAndFlush(productToDelete);
      }
    });
  });

  describe('/products/:id (PUT)', () => {
    it('should update product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated E2E Product Name',
        price: 125.75,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateDto)
        .expect(200);

      const body = response.body as Product;
      expect(body.id).toEqual(createdProduct.id);
      expect(body.name).toEqual(updateDto.name);
      expect(body.price).toEqual(updateDto.price);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .put('/products/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: '업데이트된 상품' })
        .expect(404);
    });
  });

  describe('/products/:id (DELETE)', () => {
    let productToDeleteId: string;
    beforeAll(async () => {
      if (!entityManager || !testSeller) throw new Error('Test setup incomplete for DELETE');
      const tempProduct = new Product();
      tempProduct.name = 'To Be Deleted Product';
      tempProduct.price = 10;
      tempProduct.seller = testSeller;
      tempProduct.description = 'delete me';
      tempProduct.stockQuantity = 1;
      await entityManager.persistAndFlush(tempProduct);
      productToDeleteId = tempProduct.id;
    });

    it('should delete product', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      if (entityManager) {
        const deleted = await entityManager.findOne(Product, { id: productToDeleteId });
        expect(deleted).toBeNull();
      }
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .delete('/products/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);
    });
  });
});
