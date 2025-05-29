import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';

import { AppModule } from '@/app.module';
import { setupE2eTest } from '@/test/src/api/v2/setup-e2e';
import { createTestUser } from '@/test/helpers/test-helpers';
import { UserRole } from '@/shared/enum/user-role.enum';
import { UserService } from '@/module/user/user.service';

describe('SellerUserController - Business Info (e2e)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let userService: UserService;
  let sellerToken: string;
  let sellerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    orm = app.get(MikroORM);
    userService = app.get(UserService);
    app = setupE2eTest(app);
    await app.init();
  });

  afterAll(async () => {
    await orm.close();
    await app.close();
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();

    // 테스트용 셀러 생성
    const { user: seller, token } = await createTestUser(app, {
      loginId: 'testseller',
      password: 'password123',
      name: '테스트 셀러',
      role: UserRole.SELLER,
    });
    sellerId = seller.id;
    sellerToken = token;
  });

  describe('PATCH /v2/seller/users/business-info', () => {
    it('should create business info when it does not exist', async () => {
      const businessInfoDto = {
        businessName: '테스트 상호명',
        businessAddress: '서울시 강남구 테스트로 123',
        businessNumber: '123-45-67890',
      };

      const response = await request(app.getHttpServer())
        .patch('/v2/seller/users/business-info')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(businessInfoDto)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        message: '사업자 정보가 성공적으로 업데이트되었습니다.',
        statusCode: HttpStatus.OK,
        data: businessInfoDto,
      });

      // DB에서 확인
      const sellerInfo = await userService.getSellerInfo(sellerId);
      expect(sellerInfo).toMatchObject(businessInfoDto);
    });

    it('should update existing business info', async () => {
      // 초기 사업자 정보 설정
      const initialInfo = {
        businessName: '초기 상호명',
        businessAddress: '초기 주소',
        businessNumber: '000-00-00000',
      };
      await userService.updateSellerBusinessInfo(sellerId, initialInfo);

      // 업데이트
      const updatedInfo = {
        businessName: '변경된 상호명',
        businessAddress: '변경된 주소',
        businessNumber: '999-99-99999',
      };

      const response = await request(app.getHttpServer())
        .patch('/v2/seller/users/business-info')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updatedInfo)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        message: '사업자 정보가 성공적으로 업데이트되었습니다.',
        statusCode: HttpStatus.OK,
        data: updatedInfo,
      });

      // DB에서 확인
      const sellerInfo = await userService.getSellerInfo(sellerId);
      expect(sellerInfo).toMatchObject(updatedInfo);
    });

    it('should fail with invalid request body', async () => {
      const invalidData = {
        businessName: '테스트 상호명',
        // businessAddress와 businessNumber 누락
      };

      await request(app.getHttpServer())
        .patch('/v2/seller/users/business-info')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail without authentication', async () => {
      const businessInfoDto = {
        businessName: '테스트 상호명',
        businessAddress: '서울시 강남구 테스트로 123',
        businessNumber: '123-45-67890',
      };

      await request(app.getHttpServer())
        .patch('/v2/seller/users/business-info')
        .send(businessInfoDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for non-seller users', async () => {
      // 일반 사용자 생성
      const { token: viewerToken } = await createTestUser(app, {
        loginId: 'testviewer',
        password: 'password123',
        name: '테스트 뷰어',
        role: UserRole.VIEWER,
      });

      const businessInfoDto = {
        businessName: '테스트 상호명',
        businessAddress: '서울시 강남구 테스트로 123',
        businessNumber: '123-45-67890',
      };

      await request(app.getHttpServer())
        .patch('/v2/seller/users/business-info')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(businessInfoDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});