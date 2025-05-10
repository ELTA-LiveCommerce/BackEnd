import { MikroOrmModule, getMikroORMToken } from '@mikro-orm/nestjs';
import {
  INestApplication,
  Injectable,
  Logger,
  ValidationPipe,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule, AuthGuard } from '@nestjs/passport';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { MikroORM } from '@mikro-orm/core';
import { HttpExceptionFilter } from '@/shared/filter/http-exception.filter';
import mikroOrmConfigFunction from '@/infra/database/mikro-orm.config';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { HttpAdapterHost } from '@nestjs/core';
import { TokenBlacklistService } from '@/module/auth/token-blacklist.service';
import { UserService } from '@/module/user/user.service';
// import { GlobalResponseInterceptor } from '@/common/interceptors/global-response.interceptor'; // 다시 주석 처리

/**
 * E2E 테스트를 위한 통합 유틸리티
 */

// 모의 사용자
export const mockViewer: Partial<User> = {
  id: 'viewer-test-id',
  email: 'test-viewer@example.com',
  name: 'Test Viewer',
  role: UserRole.VIEWER,
};

export const mockSeller: Partial<User> = {
  id: 'seller-test-id',
  email: 'test-seller@example.com',
  name: 'Test Seller',
  role: UserRole.SELLER,
};

export const mockAdmin: Partial<User> = {
  id: 'admin-test-id',
  email: 'test-admin@example.com',
  name: 'Test Admin',
  role: UserRole.ADMIN,
};

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
export function generateTestToken(
  jwtService: JwtService,
  userId = 'test-user-id',
  email = 'test@example.com',
  role = UserRole.VIEWER,
  expiresIn = '24h',
): string {
  const secret = 'test-e2e-super-secret-key-12345'; // 하드코딩된 시크릿
  // console.log('[generateTestToken] Signing with secret:', secret, 'expiresIn:', expiresIn);
  return jwtService.sign({ sub: userId, email, role, iss: 'test-issuer' }, { secret: secret, expiresIn });
}

/**
 * 모의 JWT 전략
 */
@Injectable()
export class CustomMockJwtStrategy {
  constructor(private readonly validateFn: (payload: any) => any | Promise<any>) {}
}

export const defaultMockJwtValidate = (payload: any) => {
  if (payload.userId && payload.email && payload.role) {
    return { id: payload.userId, email: payload.email, role: payload.role };
  }
  return null;
};

export interface E2ETestingOptions {
  imports?: any[];
  providers?: any[];
  controllers?: any[];
}

export const mockUserService = {
  findOneByEmail: jest.fn(),
  create: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  getSellerLivePage: jest.fn(),
  getSellerProductPage: jest.fn(),
  findOne: jest.fn(),
  findByUsernameContaining: jest.fn(),
};

export const mockUserFollowService = {
  follow: jest.fn(),
  unfollow: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
  isFollowing: jest.fn(),
};

export const mockBroadcastService = {
  findBySellerId: jest.fn(),
};

export const mockProductService = {
  findProductsBySeller: jest.fn(),
};

export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

export const mockTokenBlacklistService = {
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
  blacklistToken: jest.fn(),
};

// MockJwtAuthGuard 클래스 정의
@Injectable()
export class MockJwtAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    const secretToVerify = 'test-e2e-super-secret-key-12345'; // 하드코딩된 시크릿
    // console.log('[MockJwtAuthGuard] Verifying token:', token, 'with secret:', secretToVerify);

    try {
      const payload = this.jwtService.verify(token, {
        secret: secretToVerify,
        ignoreExpiration: false,
      });
      // console.log('[MockJwtAuthGuard] Verified Payload:', payload);
      // console.log('[MockJwtAuthGuard] Comparing with mockViewer.id:', mockViewer.id);
      // console.log('[MockJwtAuthGuard] Comparing with mockSeller.id:', mockSeller.id);
      // console.log('[MockJwtAuthGuard] Comparing with mockAdmin.id:', mockAdmin.id);

      if (payload.sub === 'unauthenticated-test-user') {
        throw new UnauthorizedException('Explicitly unauthenticated user');
      }

      console.log(
        `[MockJwtAuthGuard] Comparing payload.sub: '${payload.sub}' (type: ${typeof payload.sub}) with mockViewer.id: '${mockViewer.id}' (type: ${typeof mockViewer.id})`,
      );
      if (payload.sub === mockViewer.id) {
        request.user = mockViewer;
      } else {
        console.log(
          `[MockJwtAuthGuard] payload.sub (${payload.sub}) did not match mockViewer.id. Checking other mock users.`,
        );
        console.log(
          `[MockJwtAuthGuard] Comparing payload.sub: '${payload.sub}' (type: ${typeof payload.sub}) with mockSeller.id: '${mockSeller.id}' (type: ${typeof mockSeller.id})`,
        );
        if (payload.sub === mockSeller.id) {
          request.user = mockSeller;
        } else {
          console.log(`[MockJwtAuthGuard] payload.sub (${payload.sub}) did not match mockSeller.id. Checking admin.`);
          console.log(
            `[MockJwtAuthGuard] Comparing payload.sub: '${payload.sub}' (type: ${typeof payload.sub}) with mockAdmin.id: '${mockAdmin.id}' (type: ${typeof mockAdmin.id})`,
          );
          if (payload.sub === mockAdmin.id) {
            request.user = mockAdmin;
          } else {
            console.log(`[MockJwtAuthGuard] payload.sub (${payload.sub}) did not match any mock user ID.`);
            throw new UnauthorizedException('Unknown user');
          }
        }
      }
      return true;
    } catch (error) {
      console.error(
        '[MockJwtAuthGuard] Token verification failed. Token:',
        token,
        'Secret:',
        secretToVerify,
        'Error Object:',
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
      throw new UnauthorizedException(error.message || 'Invalid token');
    }
  }
}

export async function createE2ETestingModule(options?: E2ETestingOptions): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
  adminToken: string;
  sellerToken: string;
  viewerToken: string;
  jwtService: JwtService;
  orm: MikroORM;
}> {
  const tempConfigService = new ConfigService();
  const actualMikroOrmConfig = mikroOrmConfigFunction(tempConfigService);

  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          secret: 'test-e2e-super-secret-key-12345',
          signOptions: {
            expiresIn: '24h',
          },
        }),
        inject: [ConfigService],
      }),
      MikroOrmModule.forRoot(actualMikroOrmConfig),
      ...(options?.imports || []),
    ],
    providers: [
      { provide: UserService, useValue: mockUserService },
      { provide: TokenBlacklistService, useValue: mockTokenBlacklistService },
      ...(options?.providers || []),
    ],
    controllers: options?.controllers || [],
  })
    .overrideGuard(AuthGuard('jwt'))
    .useClass(MockJwtAuthGuard);

  const moduleFixture = await testingModuleBuilder.compile();

  const app = moduleFixture.createNestApplication();

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  );

  await app.init();

  const orm = moduleFixture.get<MikroORM>(MikroORM);

  const jwtServiceFromFixture = moduleFixture.get(JwtService);
  const adminToken = generateTestToken(jwtServiceFromFixture, mockAdmin.id!, mockAdmin.email!, mockAdmin.role!, '24h');
  const sellerToken = generateTestToken(
    jwtServiceFromFixture,
    mockSeller.id!,
    mockSeller.email!,
    mockSeller.role!,
    '24h',
  );
  const viewerToken = generateTestToken(
    jwtServiceFromFixture,
    mockViewer.id!,
    mockViewer.email!,
    mockViewer.role!,
    '24h',
  );

  return {
    app,
    moduleFixture,
    adminToken,
    sellerToken,
    viewerToken,
    jwtService: jwtServiceFromFixture,
    orm,
  };
}

export async function closeE2ETestingModule(app: INestApplication, orm?: MikroORM) {
  if (orm && orm.em && (orm.em.getConnection() as any)?.isInitialized()) {
    await orm.close(true);
  }
  if (app) {
    await app.close();
  }
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
