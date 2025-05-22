import { MikroOrmModule, getMikroORMToken } from '@mikro-orm/nestjs';
import {
  INestApplication,
  Injectable,
  Logger,
  ValidationPipe,
  UnauthorizedException,
  BadRequestException,
  Global,
  Module,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule, AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { MikroORM, Options, EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { AbstractSqlDriver, AbstractSqlPlatform } from '@mikro-orm/knex';
import { HttpExceptionFilter } from '@/shared/filter/http-exception.filter';
import mikroOrmConfigFunction from '@/infra/database/mikro-orm.config';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { HttpAdapterHost, APP_FILTER } from '@nestjs/core';
import { TokenBlacklistService } from '@/module/auth/token-blacklist.service';
import { UserService } from '@/module/user/user.service';
import { UserModule } from '@/module/user/user.module';
import { ExtractJwt, Strategy as JwtStrategyPassport } from 'passport-jwt';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { ProductService } from '@/module/product/product.service';

/**
 * E2E 테스트를 위한 통합 유틸리티
 */

// 모의 사용자
export const mockViewer: Partial<User> = {
  id: 'viewer-test-id',
  loginId: 'test-viewer@example.com',
  name: 'Test Viewer',
  role: UserRole.VIEWER,
};

export const mockSeller: Partial<User> = {
  id: 'seller-test-id',
  loginId: 'test-seller@example.com',
  name: 'Test Seller',
  role: UserRole.SELLER,
};

export const mockAdmin: Partial<User> = {
  id: 'admin-test-id',
  loginId: 'test-admin@example.com',
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
export const TEST_E2E_JWT_SECRET = 'test-e2e-super-secret-key-12345-consistent';
export const TEST_E2E_JWT_EXPIRES_IN = '24h';

export function generateTestToken(
  jwtService: JwtService,
  userId = 'test-user-id',
  loginId = 'test@example.com',
  role = UserRole.VIEWER,
  expiresIn = TEST_E2E_JWT_EXPIRES_IN,
): string {
  return jwtService.sign({ sub: userId, loginId, role, iss: 'test-issuer' }, { expiresIn });
}

/**
 * 모의 JWT 전략 (실제 Passport Strategy 상속)
 */
@Injectable()
export class MockJwtStrategyForE2E extends PassportStrategy(JwtStrategyPassport, 'jwt') {
  private readonly logger = new Logger(MockJwtStrategyForE2E.name);

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('JWT_SECRET', TEST_E2E_JWT_SECRET),
      passReqToCallback: true,
    });
    this.logger.log('MockJwtStrategyForE2E initialized');
  }

  async validate(req: any, payload: any): Promise<Partial<User> | null> {
    this.logger.debug(`[MockJwtStrategyForE2E] validate() called. Request path: ${req.path}`);
    this.logger.debug(`[MockJwtStrategyForE2E] Payload: ${JSON.stringify(payload)}`);

    if (!payload || !payload.sub) {
      this.logger.warn('[MockJwtStrategyForE2E] Payload or sub is missing');
      throw new UnauthorizedException('페이로드 또는 사용자 ID 없음 (MockJwtStrategyForE2E)');
    }

    if (payload.sub === 'unauthenticated-test-user') {
      this.logger.log('[MockJwtStrategyForE2E] Unauthenticated user detected by sub. Returning null.');
      return null;
    }

    if (payload.sub === mockViewer.id) {
      this.logger.log(`[MockJwtStrategyForE2E] Returning mockViewer for sub: ${payload.sub}`);
      return mockViewer as User;
    }
    if (payload.sub === mockSeller.id) {
      this.logger.log(`[MockJwtStrategyForE2E] Returning mockSeller for sub: ${payload.sub}`);
      return mockSeller as User;
    }
    if (payload.sub === mockAdmin.id) {
      this.logger.log(`[MockJwtStrategyForE2E] Returning mockAdmin for sub: ${payload.sub}`);
      return mockAdmin as User;
    }

    this.logger.warn(
      `[MockJwtStrategyForE2E] Unknown sub: ${payload.sub}. Returning simplified user based on payload.`,
    );
    const simplifiedUser: Partial<User> = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      name: payload.name || `Test User ${payload.sub}`,
      phoneNumber: payload.phoneNumber || undefined,
      bankName: payload.bankName || undefined,
      accountNumber: payload.accountNumber || undefined,
      profileImage: payload.profileImage || undefined,
    };
    return simplifiedUser as User;
  }
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
  updateBankInfo: jest.fn(),
  getSellerLivePage: jest.fn(),
  getSellerProductPage: jest.fn(),
  findOne: jest.fn(),
  findByUsernameContaining: jest.fn().mockResolvedValue({ items: [], total: 0 }),
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
export class MockJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(MockJwtAuthGuard.name);

  constructor() {
    super();
    this.logger.log('MockJwtAuthGuard initialized');
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`[MockJwtAuthGuard] handleRequest() called. Request path: ${request.path}`);
    this.logger.debug(`[MockJwtAuthGuard] Error: ${JSON.stringify(err)}`);
    this.logger.debug(`[MockJwtAuthGuard] User from strategy: ${JSON.stringify(user)}`);
    this.logger.debug(`[MockJwtAuthGuard] Info: ${JSON.stringify(info)}`);
    this.logger.debug(`[MockJwtAuthGuard] Status: ${status}`);

    if (err) {
      this.logger.error('[MockJwtAuthGuard] Error received:', err);
      throw err;
    }
    if (info && info.name === 'TokenExpiredError' && !user) {
      this.logger.warn('[MockJwtAuthGuard] TokenExpiredError detected.');
      throw new UnauthorizedException('토큰 만료 (MockJwtAuthGuard)');
    }
    if (info && info.name === 'JsonWebTokenError' && !user) {
      this.logger.warn(`[MockJwtAuthGuard] JsonWebTokenError detected: ${info.message}`);
      throw new UnauthorizedException(`JWT 오류 (MockJwtAuthGuard): ${info.message}`);
    }
    if (!user) {
      this.logger.warn('[MockJwtAuthGuard] No user returned from strategy. Throwing UnauthorizedException.');
      throw new UnauthorizedException('인증 실패 (MockJwtAuthGuard) - 사용자 없음');
    }
    this.logger.log(`[MockJwtAuthGuard] User authenticated and set to request: ${JSON.stringify(user)}`);
    request.user = user;
    return user;
  }
}

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', TEST_E2E_JWT_SECRET),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', TEST_E2E_JWT_EXPIRES_IN),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [MockJwtStrategyForE2E],
  exports: [JwtModule, MockJwtStrategyForE2E],
})
export class GlobalE2EJwtModule {}

export interface CreateE2ETestingModuleOptions {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
  overrideProviders?: Array<{ token: any; useValue: any }>;
}

export function getMikroOrmTestConfig(): Options<IDatabaseDriver<Connection>> {
  const configService = new ConfigService();
  return mikroOrmConfigFunction(configService);
}

export async function createE2ETestingModule({
  imports = [],
  controllers = [],
  providers = [],
  overrideProviders = [],
}: Omit<CreateE2ETestingModuleOptions, 'shouldMockMikroORM'> = {}): Promise<{
  app: INestApplication;
  mikroOrmConfig: Options<IDatabaseDriver<Connection>>;
  orm: MikroORM;
  em: EntityManager;
  jwtService: JwtService;
  configService: ConfigService;
  adminToken: string;
  sellerToken: string;
  viewerToken: string;
  unauthenticatedToken: string;
}> {
  const mikroOrmConfig = getMikroOrmTestConfig();

  let testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
        ignoreEnvFile: process.env.NODE_ENV === 'production',
      }),
      UserModule,
      GlobalE2EJwtModule,
      PassportModule.register({ defaultStrategy: 'jwt' }),
      MikroOrmModule.forRoot(mikroOrmConfig),
      ...(imports || []),
    ],
    controllers: [...(controllers || [])],
    providers: [
      HttpExceptionFilter,
      {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter,
      },
      ...(providers || []),
    ],
  });

  testingModuleBuilder = testingModuleBuilder.overrideGuard(AuthGuard('jwt')).useClass(MockJwtAuthGuard);
  testingModuleBuilder = testingModuleBuilder.overrideGuard(JwtAuthGuard).useClass(MockJwtAuthGuard);

  testingModuleBuilder = testingModuleBuilder.overrideProvider(UserService).useValue(mockUserService);
  testingModuleBuilder = testingModuleBuilder.overrideProvider(mockBroadcastService).useValue(mockBroadcastService);
  testingModuleBuilder = testingModuleBuilder.overrideProvider(mockProductService).useValue(mockProductService);
  testingModuleBuilder = testingModuleBuilder
    .overrideProvider(TokenBlacklistService)
    .useValue(mockTokenBlacklistService);

  if (overrideProviders && overrideProviders.length > 0) {
    for (const { token, useValue } of overrideProviders) {
      testingModuleBuilder = testingModuleBuilder.overrideProvider(token).useValue(useValue);
    }
  }

  const moduleFixture: TestingModule = await testingModuleBuilder.compile();

  const app = moduleFixture.createNestApplication();

  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(errors);
      },
    }),
  );

  await app.init();

  const orm = moduleFixture.get<MikroORM>(MikroORM);
  const em = orm.em;

  const jwtServiceFromFixture = moduleFixture.get(JwtService);
  const configServiceFromFixture = moduleFixture.get(ConfigService);

  const adminToken = generateTestToken(jwtServiceFromFixture, mockAdmin.id!, mockAdmin.email!, mockAdmin.role!);
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
  const unauthenticatedToken = generateTestToken(
    jwtServiceFromFixture,
    'unauthenticated-test-user',
    'invalid@example.com',
    UserRole.VIEWER,
    '1s',
  );

  return {
    app,
    mikroOrmConfig,
    orm,
    em,
    jwtService: jwtServiceFromFixture,
    configService: configServiceFromFixture,
    adminToken,
    sellerToken,
    viewerToken,
    unauthenticatedToken,
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

