import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { UserRole } from '@/shared/enum/user-role.enum';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { SellerControllerModule } from '@/api/v2/viewer/seller/seller-controller.module';
import { UserModule } from '@/module/user/user.module';
import { AuthModule } from '@/module/auth/auth.module';
import { HttpExceptionFilter } from '@/shared/filter/http-exception.filter';
import { PagedResponseData } from '@/api/v2/common/base-response.dto';

import {
  TEST_E2E_JWT_SECRET,
  TEST_E2E_JWT_EXPIRES_IN,
  createE2ETestingModule,
  generateTestToken,
  mockViewer,
  mockSeller,
  mockProductService,
  mockBroadcastService,
} from '@test/helpers/e2e-test-utils';
import { SellerLivePageDto } from '@/api/v2/viewer/seller/seller.dto';

jest.useRealTimers(); // 실제 시간 사용 강제

describe('Seller Controller (e2e)', () => {
  let app: INestApplication;
  let viewerToken: string;
  let unauthenticatedToken: string;
  let jwtService: JwtService;
  let userService: UserService;
  let findOneSpy: jest.SpyInstance<Promise<User | undefined>, [id: string]>;
  let findByUsernameContainingSpy: jest.SpyInstance<
    Promise<PagedResponseData<User>>,
    [keyword?: string, role?: UserRole, limit?: number, offset?: number]
  >;

  // 모의 라이브 방송 및 상품 데이터 (mockSellerData 사용하도록 수정)
  const mockLives = [
    { id: 'live-1', title: 'Test Live 1', sellerId: mockSeller.id },
    { id: 'live-2', title: 'Test Live 2', sellerId: mockSeller.id },
  ];

  const mockProducts = [
    { id: 'product-1', name: 'Test Product 1', sellerId: mockSeller.id, price: 10000 },
    { id: 'product-2', name: 'Test Product 2', sellerId: mockSeller.id, price: 20000 },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await createE2ETestingModule({
      imports: [SellerControllerModule, UserModule, AuthModule, ConfigModule.forRoot()],
    });

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => new BadRequestException(errors),
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost)));

    await app.init();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userService = moduleFixture.get<UserService>(UserService);

    viewerToken = generateTestToken(jwtService, mockViewer.id, mockViewer.email, UserRole.VIEWER);
    unauthenticatedToken = generateTestToken(
      jwtService,
      'unauthenticated-test-user',
      'invalid@example.com',
      UserRole.VIEWER,
    );

    findByUsernameContainingSpy = jest.spyOn(userService, 'findByUsernameContaining') as unknown as jest.SpyInstance<
      Promise<PagedResponseData<User>>,
      [keyword?: string, role?: UserRole, limit?: number, offset?: number]
    >;
    findByUsernameContainingSpy.mockImplementation(
      async (keyword?: string, role?: UserRole, limit?: number, offset?: number): Promise<PagedResponseData<User>> => {
        if (keyword === 'Test' && role === UserRole.SELLER) {
          return {
            items: [
              mockSeller,
              { ...mockSeller, id: 'seller-test-id-2', username: 'TestSeller2', name: 'TestSeller2Name' },
            ] as User[],
            total: 2,
            page: 1,
            limit: limit || 10,
            totalPages: Math.ceil(2 / (limit || 10)),
          };
        }
        return { items: [], total: 0, page: 1, limit: limit || 10, totalPages: 0 };
      },
    );

    findOneSpy = jest.spyOn(userService, 'findOne') as unknown as jest.SpyInstance<
      Promise<User | undefined>,
      [id: string]
    >;
    findOneSpy.mockImplementation(async (id: string): Promise<User | undefined> => {
      if (id === 'seller-id') {
        return mockSeller as User;
      }
      return undefined;
    });
  });

  afterAll(async () => {
    await app.close();
    if (findOneSpy) findOneSpy.mockClear();
    if (findByUsernameContainingSpy) findByUsernameContainingSpy.mockClear();
  });

  describe('GET /v2/viewer/sellers/search', () => {
    it('키워드로 판매자를 검색할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/search?keyword=Test')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items[0].name).toBe(mockSeller.name);
    });

    it('인증되지 않은 사용자는 판매자 검색을 할 수 없다 (401 Unauthorized)', async () => {
      await request(app.getHttpServer())
        .get('/v2/viewer/sellers/search?keyword=Test')
        .set('Authorization', `Bearer ${unauthenticatedToken}`)
        .expect(401);
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId', () => {
    it('판매자 정보를 조회할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/seller-id')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(mockSeller.name);
    });

    it('존재하지 않는 판매자 ID로 요청하면 404 에러를 반환한다', async () => {
      await request(app.getHttpServer())
        .get('/v2/viewer/sellers/non-existent-id')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(404);
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId/lives', () => {
    it('판매자의 라이브 방송 목록을 조회할 수 있다', async () => {
      const mockLivePageData: SellerLivePageDto = {
        items: [{ id: 'live-id', title: 'Test Live', sellerId: 'seller-id' } as any],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockBroadcastService.findBySellerId.mockResolvedValueOnce([
        { id: 'live-id', title: 'Test Live', sellerId: 'seller-id' },
      ] as any);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/seller-id/lives')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items[0].title).toBe('Test Live');
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId/products', () => {
    it('판매자의 상품 목록을 조회할 수 있다', async () => {
      mockProductService.findProductsBySeller.mockResolvedValueOnce([
        { id: 'product-id', name: 'Test Product' },
      ] as any);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/seller-id/products')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items[0].name).toBe('Test Product');
    });
  });
});
