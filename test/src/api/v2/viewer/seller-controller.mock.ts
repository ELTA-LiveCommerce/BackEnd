import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { SellerController } from '@/api/v2/viewer/seller/seller.controller';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

// 모의 사용자 데이터
export const mockViewer: Partial<User> = {
  id: '12345-mock-viewer-id',
  email: 'test-viewer@example.com',
  name: '테스트 뷰어',
  role: UserRole.VIEWER,
};

export const mockSeller: Partial<User> = {
  id: '67890-mock-seller-id',
  email: 'test-seller@example.com',
  name: '테스트 판매자',
  role: UserRole.SELLER,
};

// 모의 라이브 방송 및 상품 데이터
export const mockLives = [
  { id: 'live-1', title: 'Test Live 1', sellerId: mockSeller.id },
  { id: 'live-2', title: 'Test Live 2', sellerId: mockSeller.id },
];

export const mockProducts = [
  { id: 'product-1', name: 'Test Product 1', sellerId: mockSeller.id, price: 10000 },
  { id: 'product-2', name: 'Test Product 2', sellerId: mockSeller.id, price: 20000 },
];

// 모의 가드 클래스
export class MockJwtAuthGuard {
  canActivate(context) {
    const req = context.switchToHttp().getRequest();

    // Authorization 헤더가 있는지 확인
    if (!req.headers.authorization) {
      return false;
    }

    // 사용자 정보 설정
    req.user = mockViewer;
    return true;
  }
}

export class MockRolesGuard {
  canActivate() {
    return true;
  }
}

/**
 * 판매자 컨트롤러 테스트를 위한 모의 테스트 모듈 생성
 */
export async function createSellerTestingModule(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
  viewerToken: string;
  testSeller: Partial<User>;
}> {
  // 모의 UserService 생성
  const mockUserService = {
    findById: jest.fn().mockImplementation((id) => {
      if (id === mockSeller.id) return Promise.resolve(mockSeller);
      if (id === mockViewer.id) return Promise.resolve(mockViewer);
      return Promise.resolve(null);
    }),
    findSellerById: jest.fn().mockImplementation((id) => {
      if (id === mockSeller.id) return Promise.resolve(mockSeller);
      if (id === 'non-existent-id') return Promise.resolve(null);
      return Promise.resolve(mockSeller);
    }),
    searchSellers: jest.fn().mockResolvedValue([mockSeller]),
    getSellerLives: jest.fn().mockImplementation((sellerId, page = 1, limit = 10) => {
      return Promise.resolve({
        items: mockLives,
        total: mockLives.length,
        page,
        limit,
        totalPages: 1,
      });
    }),
    getSellerProducts: jest.fn().mockImplementation((sellerId, page = 1, limit = 10) => {
      return Promise.resolve({
        items: mockProducts,
        total: mockProducts.length,
        page,
        limit,
        totalPages: 1,
      });
    }),
  };

  // 모의 BroadcastService 생성
  const mockBroadcastService = {
    getLivesBySellerIdPaginated: jest.fn().mockImplementation((sellerId, page = 1, limit = 10) => {
      return Promise.resolve({
        items: mockLives,
        total: mockLives.length,
        page,
        limit,
        totalPages: 1,
      });
    }),
  };

  // 모의 ProductService 생성
  const mockProductService = {
    getProductsBySellerIdPaginated: jest.fn().mockImplementation((sellerId, page = 1, limit = 10) => {
      return Promise.resolve({
        items: mockProducts,
        total: mockProducts.length,
        page,
        limit,
        totalPages: 1,
      });
    }),
  };

  // JWT 서비스 구성
  const jwtService = new JwtService({
    secret: 'test-secret',
    signOptions: { expiresIn: '1h' },
  });

  // 모의 UserFollowService
  const mockUserFollowService = {
    getFollowedSellers: jest.fn().mockResolvedValue([]),
    isFollowing: jest.fn().mockResolvedValue(false),
    followSeller: jest.fn().mockResolvedValue(true),
    unfollowSeller: jest.fn().mockResolvedValue(true),
  };

  // 테스트 모듈 구성
  const moduleFixture = await Test.createTestingModule({
    controllers: [SellerController],
    providers: [
      {
        provide: UserService,
        useValue: mockUserService,
      },
      {
        provide: 'BroadcastService',
        useValue: mockBroadcastService,
      },
      {
        provide: 'ProductService',
        useValue: mockProductService,
      },
      {
        provide: JwtService,
        useValue: jwtService,
      },
      {
        provide: 'UserFollowService',
        useValue: mockUserFollowService,
      },
    ],
  })
    .overrideGuard('JwtAuthGuard')
    .useClass(MockJwtAuthGuard)
    .overrideGuard('RolesGuard')
    .useClass(MockRolesGuard)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  // 테스트용 JWT 토큰 생성
  const viewerToken = jwtService.sign({
    sub: mockViewer.id,
    email: mockViewer.email,
    role: mockViewer.role,
  });

  return { app, moduleFixture, viewerToken, testSeller: mockSeller };
}
