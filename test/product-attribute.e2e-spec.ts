import { EntityManager } from '@mikro-orm/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

import { ProductAttribute } from '@/module/product/entity/product-attribute.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { ProductStatus } from '@/shared/enum/product-status.enum';
import { UserRole } from '@/shared/enum/user-role.enum';

import { generateTestToken } from './helpers/auth.helper';
import { setupTestApp, cleanupTestApp } from './helpers/test-db.helper';

describe('ProductAttributeController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testToken: string;
  let sellerUser: User;
  let testProduct: Product;
  let entityManager: EntityManager;

  beforeAll(async () => {
    // 테스트 앱 설정
    const { app: testApp, em } = await setupTestApp();
    app = testApp;
    app.useGlobalPipes(new ValidationPipe());

    entityManager = em;
    jwtService = app.get(JwtService);

    sellerUser = new User();
    sellerUser.email = 'seller.pa.e2e@example.com';
    sellerUser.name = 'E2E PA Seller';
    sellerUser.role = UserRole.SELLER;
    sellerUser.password = 'testpassword';
    sellerUser.isVerified = true;
    await entityManager.persistAndFlush(sellerUser);

    testToken = generateTestToken(jwtService, sellerUser.id, sellerUser.email, sellerUser.role);

    testProduct = new Product();
    testProduct.name = 'E2E PA Test Product';
    testProduct.price = 10000;
    testProduct.status = ProductStatus.ACTIVE;
    testProduct.seller = sellerUser;
    testProduct.description = 'E2E Test Description';
    testProduct.stockQuantity = 10;
    await entityManager.persistAndFlush(testProduct);
  });

  afterAll(async () => {
    if (entityManager && typeof entityManager.getUnitOfWork === 'function') {
      if (testProduct && testProduct.id) {
        const productAttrs = await entityManager.find(ProductAttribute, { product: testProduct });
        for (const attr of productAttrs) {
          await entityManager.removeAndFlush(attr);
        }
        const productToDelete = await entityManager.findOne(Product, { id: testProduct.id });
        if (productToDelete) await entityManager.removeAndFlush(productToDelete);
      }
      if (sellerUser && sellerUser.id) {
        const userToDelete = await entityManager.findOne(User, { id: sellerUser.id });
        if (userToDelete) await entityManager.removeAndFlush(userToDelete);
      }
    }
    await cleanupTestApp(app);
  });

  describe('/products/:productId/attributes (GET)', () => {
    let attr1: ProductAttribute, attr2: ProductAttribute;
    beforeAll(async () => {
      attr1 = new ProductAttribute();
      attr1.product = testProduct;
      attr1.name = 'Model';
      attr1.value = 'S24';
      attr2 = new ProductAttribute();
      attr2.product = testProduct;
      attr2.name = 'Brand';
      attr2.value = 'Samsung';
      if (entityManager) await entityManager.persistAndFlush([attr1, attr2]);
    });
    afterAll(async () => {
      if (entityManager && typeof entityManager.getUnitOfWork === 'function') {
        if (attr1 && attr1.id) await entityManager.removeAndFlush(attr1);
        if (attr2 && attr2.id) await entityManager.removeAndFlush(attr2);
      }
    });

    it('should return all attributes for product', () => {
      return request(app.getHttpServer())
        .get(`/products/${testProduct.id}/attributes`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200)
        .then((res) => {
          const body = res.body as ProductAttribute[];
          expect(Array.isArray(body)).toBeTruthy();
          expect(body.length).toBeGreaterThanOrEqual(2);
          const foundModel = body.find((a) => a.name === 'Model');
          expect(foundModel).toBeDefined();
          if (foundModel) expect(foundModel.value).toEqual('S24');
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer()).get('/products/non-existent-id/attributes').expect(404);
    });
  });

  describe('/products/:productId/attributes/:id (GET)', () => {
    let testAttr: ProductAttribute;
    beforeAll(async () => {
      testAttr = new ProductAttribute();
      testAttr.product = testProduct;
      testAttr.name = 'Color';
      testAttr.value = 'Black';
      await entityManager.persistAndFlush(testAttr);
    });
    afterAll(async () => {
      if (entityManager && typeof entityManager.getUnitOfWork === 'function') {
        if (testAttr && testAttr.id) await entityManager.removeAndFlush(testAttr);
      }
    });

    it('should return attribute by id', () => {
      return request(app.getHttpServer())
        .get(`/products/${testProduct.id}/attributes/${testAttr.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200)
        .then((res) => {
          const body = res.body as ProductAttribute;
          expect(body.id).toEqual(testAttr.id);
          expect(body.name).toEqual(testAttr.name);
          expect(body.value).toEqual(testAttr.value);
        });
    });

    it('should return 404 for non-existent attribute', () => {
      return request(app.getHttpServer()).get('/products/product-id-1/attributes/non-existent-id').expect(404);
    });
  });

  describe('/products/:productId/attributes (POST)', () => {
    it('should create new attribute', async () => {
      const createAttributeDto = {
        name: 'Storage',
        value: '512GB',
      };

      const response = await request(app.getHttpServer())
        .post(`/products/${testProduct.id}/attributes`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(createAttributeDto)
        .expect(201);

      const body = response.body as ProductAttribute;
      expect(body.id).toBeDefined();
      expect(body.name).toEqual(createAttributeDto.name);
      expect(body.value).toEqual(createAttributeDto.value);

      if (body.id && entityManager && typeof entityManager.getUnitOfWork === 'function') {
        const attrToDelete = await entityManager.findOne(ProductAttribute, { id: body.id });
        if (attrToDelete) await entityManager.removeAndFlush(attrToDelete);
      }
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
    let testAttrForUpdate: ProductAttribute;
    beforeAll(async () => {
      testAttrForUpdate = new ProductAttribute();
      testAttrForUpdate.product = testProduct;
      testAttrForUpdate.name = 'Original Name for Update';
      testAttrForUpdate.value = 'Original Value for Update';
      await entityManager.persistAndFlush(testAttrForUpdate);
    });
    afterAll(async () => {
      if (entityManager && typeof entityManager.getUnitOfWork === 'function') {
        if (testAttrForUpdate && testAttrForUpdate.id) await entityManager.removeAndFlush(testAttrForUpdate);
      }
    });

    it('should update attribute', () => {
      const updateAttributeDto = {
        name: 'Updated Name',
        value: 'Updated Value',
      };

      return request(app.getHttpServer())
        .put(`/products/${testProduct.id}/attributes/${testAttrForUpdate.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(updateAttributeDto)
        .expect(200)
        .then((res) => {
          const body = res.body as ProductAttribute;
          expect(body.id).toEqual(testAttrForUpdate.id);
          expect(body.name).toEqual(updateAttributeDto.name);
          expect(body.value).toEqual(updateAttributeDto.value);
        });
    });

    it('should return 404 for non-existent attribute', () => {
      return request(app.getHttpServer())
        .put(`/products/${testProduct.id}/attributes/non-existent-id`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'New Name', value: 'New Value' })
        .expect(404);
    });
  });

  describe('/products/:productId/attributes/:id (DELETE)', () => {
    let testAttrForDelete: ProductAttribute;
    beforeAll(async () => {
      testAttrForDelete = new ProductAttribute();
      testAttrForDelete.product = testProduct;
      testAttrForDelete.name = 'Attribute to Delete';
      testAttrForDelete.value = 'Value to Delete';
      await entityManager.persistAndFlush(testAttrForDelete);
    });

    it('should delete attribute', () => {
      return request(app.getHttpServer())
        .delete(`/products/${testProduct.id}/attributes/${testAttrForDelete.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent attribute', () => {
      return request(app.getHttpServer())
        .delete(`/products/${testProduct.id}/attributes/non-existent-id`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('/products/:productId/attributes/bulk (POST)', () => {
    it('should create multiple attributes', () => {
      const createAttributesDto = [
        { name: 'Bulk Attr 1', value: 'Value 1' },
        { name: 'Bulk Attr 2', value: 'Value 2' },
      ];

      return request(app.getHttpServer())
        .post(`/products/${testProduct.id}/attributes/bulk`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(createAttributesDto)
        .expect(201)
        .then(async (res) => {
          const body = res.body as ProductAttribute[];
          expect(Array.isArray(body)).toBeTruthy();
          expect(body.length).toEqual(2);

          // Clean up the created attributes
          for (const attr of body) {
            if (attr.id && entityManager) {
              const attrToDelete = await entityManager.findOne(ProductAttribute, { id: attr.id });
              if (attrToDelete) await entityManager.removeAndFlush(attrToDelete);
            }
          }
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .post('/products/non-existent-id/attributes/bulk')
        .set('Authorization', `Bearer ${testToken}`)
        .send([{ name: '속성1', value: '값1' }])
        .expect(404);
    });
  });
});
