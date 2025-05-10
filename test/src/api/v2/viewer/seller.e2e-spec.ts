import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@/shared/enum/user-role.enum';
import { UserService } from '@/module/user/user.service';
import { SellerController } from '@/api/v2/viewer/seller/seller.controller';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { ProductService } from '@/module/product/product.service';
import {
  createE2ETestingModule,
  closeE2ETestingModule,
  mockUserService,
  mockBroadcastService,
  mockProductService,
  generateTestToken,
  mockViewer,
} from '@test/helpers/e2e-test-utils';
import { SellerLivePageDto } from '@/api/v2/viewer/seller/seller.dto';

jest.useRealTimers(); // 실제 시간 사용 강제

// 테스트용 판매자 데이터 정의를 파일 상단으로 이동
const mockSellerData = {
  id: 'test-seller-id-123',
  email: 'seller@example.com',
  name: 'Test Seller Name',
  profileImage: 'seller_profile.jpg',
  role: UserRole.SELLER,
};

describe('Seller Controller (e2e)', () => {
  let app: INestApplication;
  let viewerToken: string;
  let unauthenticatedToken: string;
  let mockUserServiceInstance: typeof mockUserService;
  let mockBroadcastServiceInstance: typeof mockBroadcastService;
  let mockProductServiceInstance: typeof mockProductService;
  let jwtService: JwtService;

  // 모의 라이브 방송 및 상품 데이터 (mockSellerData 사용하도록 수정)
  const mockLives = [
    { id: 'live-1', title: 'Test Live 1', sellerId: mockSellerData.id },
    { id: 'live-2', title: 'Test Live 2', sellerId: mockSellerData.id },
  ];

  const mockProducts = [
    { id: 'product-1', name: 'Test Product 1', sellerId: mockSellerData.id, price: 10000 },
    { id: 'product-2', name: 'Test Product 2', sellerId: mockSellerData.id, price: 20000 },
  ];

  beforeAll(async () => {
    try {
      mockUserServiceInstance = {
        ...mockUserService,
        findByUsernameContaining: jest.fn().mockResolvedValue([{ id: 'seller-id', name: 'Test Seller' }]),
        findOne: jest.fn().mockImplementation((id) => {
          if (id === 'seller-id')
            return Promise.resolve({ id: 'seller-id', name: 'Test Seller', role: UserRole.SELLER });
          return Promise.resolve(null);
        }),
      };
      mockBroadcastServiceInstance = {
        ...mockBroadcastService,
        findBySellerId: jest.fn().mockResolvedValue([{ id: 'broadcast-1', title: 'Test Live' }]),
      };
      mockProductServiceInstance = {
        ...mockProductService,
        findProductsBySeller: jest.fn().mockResolvedValue([{ id: 'product-1', name: 'Test Product' }]),
      };

      const {
        app: testingApp,
        viewerToken: tokenFromSetup,
        jwtService: appJwtService,
      } = await createE2ETestingModule({
        controllers: [SellerController],
        providers: [
          { provide: UserService, useValue: mockUserServiceInstance },
          { provide: BroadcastService, useValue: mockBroadcastServiceInstance },
          { provide: ProductService, useValue: mockProductServiceInstance },
        ],
      });
      app = testingApp;
      viewerToken = tokenFromSetup;
      jwtService = appJwtService;

      unauthenticatedToken = generateTestToken(
        jwtService,
        'unauthenticated-test-user',
        'invalid@example.com',
        UserRole.VIEWER,
        '1s',
      );
    } catch (error) {
      console.error('테스트 설정 중 오류 발생:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await closeE2ETestingModule(app);
  });

  describe('GET /v2/viewer/sellers/search', () => {
    it('키워드로 판매자를 검색할 수 있다', async () => {
      mockUserServiceInstance.findByUsernameContaining.mockResolvedValueOnce([
        { id: 'seller-id', name: 'Test Seller', email: 'seller@test.com', role: UserRole.SELLER },
      ]);
      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/search?keyword=Test')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0].name).toBe('Test Seller');
      expect(mockUserServiceInstance.findByUsernameContaining).toHaveBeenCalledWith('Test', UserRole.SELLER, 10);
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
      mockUserServiceInstance.findOne.mockResolvedValueOnce({
        id: 'seller-id',
        name: 'Test Seller',
        email: 'seller@test.com',
        role: UserRole.SELLER,
      });
      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/seller-id')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Seller');
      expect(mockUserServiceInstance.findOne).toHaveBeenCalledWith('seller-id');
    });

    it('존재하지 않는 판매자 ID로 요청하면 404 에러를 반환한다', async () => {
      mockUserServiceInstance.findOne.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .get('/v2/viewer/sellers/non-existent-id')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(404);
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId/lives', () => {
    it('판매자의 라이브 방송 목록을 조회할 수 있다', async () => {
      // 컨트롤러는 SellerLivePageDto를 data로 반환
      const mockLivePageData: SellerLivePageDto = {
        items: [{ id: 'live-id', title: 'Test Live', sellerId: 'seller-id' } as any], // 실제 DTO 필드에 맞게 수정
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      // 서비스는 SellerLiveItemDto[] 또는 유사한 배열을 반환해야 함
      // 여기서는 컨트롤러가 SellerLivePageDto를 만드는 데 필요한 원시 배열을 반환한다고 가정.
      // 실제로는 broadcastService.findBySellerId가 반환하는 값을 기반으로 컨트롤러가 SellerLivePageDto를 구성.
      // 테스트의 단순화를 위해, 컨트롤러가 반환할 최종 data 부분인 SellerLivePageDto를 모킹할 수도 있음.
      // 하지만 여기서는 broadcastService가 아이템 배열을 반환한다고 가정하고 테스트.
      mockBroadcastServiceInstance.findBySellerId.mockResolvedValueOnce([
        { id: 'live-id', title: 'Test Live', sellerId: 'seller-id' },
      ] as any);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/seller-id/lives')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items[0].title).toBe('Test Live');
      expect(mockBroadcastServiceInstance.findBySellerId).toHaveBeenCalledWith('seller-id');
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId/products', () => {
    it('판매자의 상품 목록을 조회할 수 있다', async () => {
      // 위와 유사하게, productService.findProductsBySeller가 아이템 배열을 반환한다고 가정.
      mockProductServiceInstance.findProductsBySeller.mockResolvedValueOnce([
        { id: 'product-id', name: 'Test Product' },
      ] as any);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/sellers/seller-id/products')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items[0].name).toBe('Test Product');
      expect(mockProductServiceInstance.findProductsBySeller).toHaveBeenCalledWith('seller-id');
    });
  });
});
