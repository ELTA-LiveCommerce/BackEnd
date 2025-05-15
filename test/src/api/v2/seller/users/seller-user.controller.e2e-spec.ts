import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { SellerUserController } from '@/api/v2/seller/users/seller-user.controller';
import { UserService } from '@/module/user/user.service';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { SellerUserStatus } from '@/api/v2/seller/users/seller-user-request.dto';
import { SellerUserDerivedStatus } from '@/api/v2/seller/users/seller-user-response.dto';

// 모의 사용자 데이터
const mockSeller: Partial<User> = {
  id: 'test-seller-id',
  loginId: 'test-seller',
  name: '테스트 판매자',
  role: UserRole.SELLER,
};

const mockUsers = [
  {
    id: 'user-1',
    loginId: 'test-user1',
    name: '테스트 사용자1',
    profileImage: 'http://example.com/profile1.jpg',
    status: 'ACTIVE',
    deletedAt: null,
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'user-2',
    loginId: 'test-user2',
    name: '테스트 사용자2',
    profileImage: 'http://example.com/profile2.jpg',
    status: 'DELETED',
    deletedAt: new Date(),
    createdAt: new Date('2023-01-02'),
  },
];

// MockGuards
class MockJwtAuthGuard {
  canActivate = jest.fn().mockImplementation(() => true);
}

class MockRolesGuard {
  canActivate = jest.fn().mockImplementation(() => true);
}

/**
 * 테스트용 JWT 토큰 생성
 */
function generateTestToken(
  jwtService: JwtService,
  userId = 'test-user-id',
  loginId = 'test-user',
  role = UserRole.VIEWER,
): string {
  return jwtService.sign({
    sub: userId,
    loginId,
    role,
  });
}

describe('SellerUserController (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let jwtService: JwtService;
  let sellerToken: string;
  let viewerToken: string;

  beforeEach(async () => {
    // 모의 UserService 생성
    const mockUserService = {
      findUsersForSeller: jest.fn().mockImplementation((sellerId, queryParams) => {
        const page = queryParams.page || 1;
        const limit = queryParams.limit || 10;

        return Promise.resolve({
          items: mockUsers,
          total: mockUsers.length,
          page,
          limit,
          totalPages: Math.ceil(mockUsers.length / limit),
        });
      }),
      updateUserStatusBySeller: jest.fn().mockImplementation((sellerId, userId, statusDto) => {
        return Promise.resolve({
          id: userId,
          status: statusDto.status,
        });
      }),
    };

    // 테스트 모듈 설정
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SellerUserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);

    // JWT 서비스 및 토큰 설정
    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });

    sellerToken = generateTestToken(jwtService, mockSeller.id, mockSeller.loginId, UserRole.SELLER);
    viewerToken = generateTestToken(jwtService, 'viewer-id', 'test-viewer', UserRole.VIEWER);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /v2/seller/users', () => {
    it('판매자가 관리하는 사용자 목록을 조회할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/seller/users')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBe(2);
      expect(response.body.data.items[0].loginId).toBe('test-user1');
      expect(response.body.data.items[0].status).toBe(SellerUserDerivedStatus.ACTIVE);
      expect(response.body.data.items[1].status).toBe(SellerUserDerivedStatus.DELETED);
      expect(response.body.data.total).toBe(2);
    });

    it('검색 조건을 적용하여 사용자 목록을 필터링할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/seller/users?searchField=name&searchKeyword=사용자1')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(userService.findUsersForSeller).toHaveBeenCalledWith(
        mockSeller.id,
        expect.objectContaining({
          searchField: 'name',
          searchKeyword: '사용자1',
        }),
      );
    });

    it('페이지네이션을 적용하여 사용자 목록을 조회할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/seller/users?page=2&limit=5')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(userService.findUsersForSeller).toHaveBeenCalledWith(
        mockSeller.id,
        expect.objectContaining({
          page: '2', // 주의: 쿼리 파라미터는 문자열로 전달됨
          limit: '5',
        }),
      );
    });
  });

  describe('PATCH /v2/seller/users/:userId/status', () => {
    it('판매자가 사용자의 상태를 변경할 수 있다', async () => {
      const userId = 'user-1';
      const statusUpdateDto = {
        status: SellerUserStatus.INACTIVE,
      };

      const response = await request(app.getHttpServer())
        .patch(`/v2/seller/users/${userId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(statusUpdateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.status).toBe(SellerUserStatus.INACTIVE);
    });

    it('유효하지 않은 상태값으로 요청하면 400 에러를 반환한다', async () => {
      const userId = 'user-1';
      const invalidStatusUpdateDto = {
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .patch(`/v2/seller/users/${userId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidStatusUpdateDto)
        .expect(400);
    });
  });
});
