import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ExecutionContext, INestApplication, Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as request from 'supertest';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * E2E 테스트를 위한 통합 유틸리티
 */

// 모의 사용자
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

export const mockAdmin: Partial<User> = {
  id: '98765-mock-admin-id',
  email: 'test-admin@example.com',
  name: '테스트 관리자',
  role: UserRole.ADMIN,
};

/**
 * 직접 JWT 구현 커스텀 가드
 */
export class MockJwtAuthGuard {
  constructor(private readonly mockUser: Partial<User> = mockViewer) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // Authorization 헤더가 없으면 인증 실패
    if (!req.headers.authorization) {
      return false;
    }

    // 테스트용 사용자 정보를 req.user에 설정
    req.user = this.mockUser;
    return true;
  }
}

/**
 * 모든 접근을 허용하는 RolesGuard
 */
export class MockRolesGuard {
  canActivate() {
    return true;
  }
}

/**
 * 테스트 JWT 토큰 생성
 */
export function generateTestToken(jwtService: JwtService, user: Partial<User> = mockViewer): string {
  return jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * 모의 JWT 전략
 */
@Injectable()
export class MockJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: 'test-e2e-jwt-secret',
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, userId: payload.sub, email: payload.email, role: payload.role, username: payload.email };
  }
}

/**
 * E2E 테스트 모듈을 생성하는 함수
 */
export async function createE2ETestingModule<T>({
  controllers,
  providers,
  imports = [],
  mockUser = mockViewer,
  overrides = [],
}: {
  controllers: any[];
  providers: any[];
  imports?: any[];
  mockUser?: Partial<User>;
  overrides?: any[];
}): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
  jwtService: JwtService;
  authToken: string;
}> {
  // 기본 JWT 모듈 설정
  const jwtModule = JwtModule.register({
    secret: 'test-e2e-jwt-secret',
    signOptions: { expiresIn: '1h' },
  });

  // 테스트 모듈 생성
  const moduleFixtureBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      jwtModule,
      ...imports,
    ],
    controllers,
    providers: [
      MockJwtStrategy,
      {
        provide: getRepositoryToken(User),
        useValue: {
          findOne: jest.fn().mockImplementation((options) => {
            if (options.where?.id === mockUser.id) {
              return Promise.resolve(mockUser);
            }
            return Promise.resolve(null);
          }),
          find: jest.fn().mockResolvedValue([mockUser]),
          save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
          create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'new-id' })),
          merge: jest.fn().mockImplementation((entity, dto) => ({ ...entity, ...dto })),
          remove: jest.fn().mockResolvedValue(true),
        },
      },
      ...providers,
    ],
  });

  // Guard 재정의
  moduleFixtureBuilder.overrideGuard(JwtAuthGuard).useValue(new MockJwtAuthGuard(mockUser));

  // 사용자 추가 재정의
  for (const override of overrides) {
    moduleFixtureBuilder.overrideProvider(override.provide).useValue(override.useValue);
  }

  // 모듈 컴파일
  const moduleFixture = await moduleFixtureBuilder.compile();

  // 애플리케이션 생성
  const app = moduleFixture.createNestApplication();
  await app.init();

  // JWT 서비스 및 토큰 생성
  const jwtService = moduleFixture.get<JwtService>(JwtService);
  const authToken = generateTestToken(jwtService, mockUser);

  return { app, moduleFixture, jwtService, authToken };
}

/**
 * 요청 테스트 유틸리티 - 인증된 요청을 간편하게 생성
 */
export function testRequest(app: INestApplication, authToken?: string) {
  const reqBuilder = request(app.getHttpServer());

  return {
    // GET 요청
    get: (url: string) => {
      const req = reqBuilder.get(url);
      if (authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }
      return req;
    },

    // POST 요청
    post: (url: string, data?: any) => {
      const req = reqBuilder.post(url);
      if (authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }
      if (data) {
        req.send(data);
      }
      return req;
    },

    // PUT 요청
    put: (url: string, data?: any) => {
      const req = reqBuilder.put(url);
      if (authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }
      if (data) {
        req.send(data);
      }
      return req;
    },

    // PATCH 요청
    patch: (url: string, data?: any) => {
      const req = reqBuilder.patch(url);
      if (authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }
      if (data) {
        req.send(data);
      }
      return req;
    },

    // DELETE 요청
    delete: (url: string) => {
      const req = reqBuilder.delete(url);
      if (authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }
      return req;
    },
  };
}
