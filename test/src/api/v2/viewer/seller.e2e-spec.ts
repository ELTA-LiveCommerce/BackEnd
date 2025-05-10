import { INestApplication } from '@nestjs/common';
import { createE2ETestingModule, mockViewer, testRequest } from '@test/helpers/e2e-test-utils';

import { SellerController } from '@/api/v2/viewer/seller/seller.controller';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

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
  let testSeller: Partial<User>; // User 타입 사용

  // 모의 라이브 방송 및 상품 데이터 (mockSellerData 사용하도록 수정)
  const mockLives = [
    { id: 'live-1', title: 'Test Live 1', sellerId: mockSellerData.id },
    { id: 'live-2', title: 'Test Live 2', sellerId: mockSellerData.id },
  ];

  const mockProducts = [
    { id: 'product-1', name: 'Test Product 1', sellerId: mockSellerData.id, price: 10000 },
    { id: 'product-2', name: 'Test Product 2', sellerId: mockSellerData.id, price: 20000 },
  ];

  // seller.e2e-spec.ts 에서 사용할 모의 서비스 정의
  const mockUserService = {
    // SellerController의 searchSellers에서 사용
    findByUsernameContaining: jest.fn().mockImplementation((keyword, role, limit) => {
      if (role === UserRole.SELLER && keyword === 'test') {
        return Promise.resolve([mockSellerData]);
      }
      return Promise.resolve([]);
    }),
    // SellerController의 getSellerInfo에서 사용
    findOne: jest.fn().mockImplementation((id) => {
      if (id === mockSellerData.id) {
        return Promise.resolve(mockSellerData);
      }
      if (id === 'non-existent-id') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null); // 기본적으로 null 반환
    }),
  };

  const mockBroadcastService = {
    // SellerController의 getSellerLives에서 사용
    findBySellerId: jest.fn().mockImplementation((sellerId) => {
      if (sellerId === mockSellerData.id) {
        return Promise.resolve([
          { id: 'live-1', title: 'Test Live 1', thumbnailImage: 'thumb1.jpg', scheduledDate: new Date(), isLive: true },
          {
            id: 'live-2',
            title: 'Test Live 2',
            thumbnailImage: 'thumb2.jpg',
            scheduledDate: new Date(),
            isLive: false,
          },
        ]);
      }
      return Promise.resolve([]);
    }),
  };

  const mockProductService = {
    // SellerController의 getSellerProducts에서 사용
    findProductsBySeller: jest.fn().mockImplementation((sellerId) => {
      if (sellerId === mockSellerData.id) {
        return Promise.resolve([
          {
            id: 'product-1',
            name: 'Test Product 1',
            price: 10000,
            mainImage: 'prod_thumb1.jpg',
            shortDescription: 'Desc 1',
            stockQuantity: 10,
          },
          {
            id: 'product-2',
            name: 'Test Product 2',
            price: 20000,
            mainImage: 'prod_thumb2.jpg',
            shortDescription: 'Desc 2',
            stockQuantity: 5,
          },
        ]);
      }
      return Promise.resolve([]);
    }),
  };

  // UserFollowService는 SellerController에서 직접 사용하지 않는 것으로 보이므로, 필요시 추가
  const mockUserFollowService = {
    // getFollowedSellers: jest.fn().mockResolvedValue([]),
    // isFollowing: jest.fn().mockResolvedValue(false),
    // followSeller: jest.fn().mockResolvedValue(true),
    // unfollowSeller: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    testSeller = mockSellerData; // testSeller 할당
    try {
      // E2E 테스트 모듈 생성
      const { app: testApp, authToken: testToken } = await createE2ETestingModule({
        controllers: [SellerController],
        providers: [
          {
            provide: UserService,
            useValue: mockUserService,
          },
          {
            provide: BroadcastService,
            useValue: mockBroadcastService,
          },
          {
            provide: ProductService,
            useValue: mockProductService,
          },
          // UserFollowService는 SellerController에서 직접 사용하지 않는 것으로 보이므로 주석 처리
          // {
          //   provide: 'UserFollowService',
          //   useValue: mockUserFollowService,
          // },
        ],
        mockUser: mockViewer,
      });

      app = testApp;
      viewerToken = testToken;
    } catch (error) {
      console.error('테스트 설정 중 오류 발생:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /v2/viewer/sellers/search', () => {
    it('키워드로 판매자를 검색할 수 있다', async () => {
      const response = await testRequest(app, viewerToken)
        .get('/v2/viewer/sellers/search')
        .query({ keyword: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // 응답 구조만 확인하고 상세 내용은 서비스에 의존
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId', () => {
    it('판매자 정보를 조회할 수 있다', async () => {
      const response = await testRequest(app, viewerToken).get(`/v2/viewer/sellers/${testSeller.id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testSeller.id);
    });

    it('존재하지 않는 판매자 ID로 요청하면 404 에러를 반환한다', async () => {
      await testRequest(app, viewerToken).get('/v2/viewer/sellers/non-existent-id').expect(404);
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId/lives', () => {
    it('판매자의 라이브 방송 목록을 조회할 수 있다', async () => {
      const response = await testRequest(app, viewerToken).get(`/v2/viewer/sellers/${testSeller.id}/lives`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      // 페이지네이션 정보 확인
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.page).toBeDefined();
      expect(response.body.data.limit).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
    });
  });

  describe('GET /v2/viewer/sellers/:sellerId/products', () => {
    it('판매자의 상품 목록을 조회할 수 있다', async () => {
      const response = await testRequest(app, viewerToken)
        .get(`/v2/viewer/sellers/${testSeller.id}/products`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      // 페이지네이션 정보 확인
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.page).toBeDefined();
      expect(response.body.data.limit).toBeDefined();
      expect(response.body.data.totalPages).toBeDefined();
    });
  });
});
