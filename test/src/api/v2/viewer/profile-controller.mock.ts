import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { ProfileController } from '@/api/v2/viewer/profile/profile.controller';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

// 모의 사용자 데이터
export const mockUser: Partial<User> = {
  id: '12345-mock-id',
  email: 'test-profile-viewer@example.com',
  name: '프로필 테스트 사용자',
  role: UserRole.VIEWER,
};

// 모의 배송지 데이터
export const mockDeliveryAddress = {
  id: '67890-mock-address-id',
  receiverName: '테스트 수령인',
  address: '서울특별시 강남구 테스트로 123',
  addressDetail: '456호',
  postalCode: '12345',
  phoneNumber: '010-1234-5678',
  isDefault: true,
  userId: mockUser.id,
};

// 모의 가드 클래스
export class MockJwtAuthGuard {
  canActivate(context) {
    const req = context.switchToHttp().getRequest();

    // Authorization 헤더가 있는지 확인
    if (!req.headers.authorization) {
      return false;
    }

    // 사용자 정보 설정
    req.user = mockUser;
    return true;
  }
}

export class MockRolesGuard {
  canActivate() {
    return true;
  }
}

/**
 * 프로필 컨트롤러 테스트를 위한 모의 테스트 모듈 생성
 */
export async function createProfileTestingModule(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
  authToken: string;
  deliveryAddressId: string;
}> {
  const deliveryAddressId: string = mockDeliveryAddress.id;

  // 모의 UserService 생성
  const mockUserService = {
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockImplementation((id, userData) => {
      return Promise.resolve({ ...mockUser, ...userData });
    }),
    getDeliveryAddresses: jest.fn().mockResolvedValue([mockDeliveryAddress]),
    addDeliveryAddress: jest.fn().mockImplementation((userId, addressData) => {
      return Promise.resolve({ ...mockDeliveryAddress, ...addressData });
    }),
    updateDeliveryAddress: jest.fn().mockImplementation((userId, addressId, addressData) => {
      return Promise.resolve({ ...mockDeliveryAddress, ...addressData });
    }),
    deleteDeliveryAddress: jest.fn().mockResolvedValue(true),
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
    controllers: [ProfileController],
    providers: [
      {
        provide: UserService,
        useValue: mockUserService,
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
  const authToken = jwtService.sign({
    sub: mockUser.id,
    email: mockUser.email,
    role: mockUser.role,
  });

  return { app, moduleFixture, authToken, deliveryAddressId };
}
