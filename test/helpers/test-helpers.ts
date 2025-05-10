import { MikroORM } from '@mikro-orm/postgresql';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * E2E 테스트 환경을 설정하는 유틸리티 함수
 * @param useRealDatabase 실제 데이터베이스 연결을 사용할지 여부
 * @param options 테스트 모듈 설정 옵션
 */
export async function setupE2ETest(
  useRealDatabase: boolean = false,
  options: {
    imports?: any[];
    overrideProviders?: Array<{ provide: any; useValue: any }>;
  } = {},
): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  // 테스트 모듈 빌더 생성
  const testingModuleBuilder = Test.createTestingModule({
    imports: options.imports || [AppModule],
  });

  // 실제 데이터베이스 사용 여부에 따라 설정
  if (useRealDatabase) {
    // 글로벌 ORM 인스턴스 확인
    const orm = global.__ORM_INSTANCE__;
    if (!orm) {
      throw new Error('ORM instance is not initialized. Make sure jest-e2e-setup.ts is properly configured.');
    }

    // AppModule이 자체적으로 MikroORM을 초기화하지 않도록 설정
    testingModuleBuilder.overrideProvider(MikroORM).useValue(orm);
  } else {
    // 모킹된 MikroORM 제공
    const mockEntityManager = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      persist: jest.fn().mockReturnThis(),
      flush: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockReturnThis(),
      create: jest.fn((entityClass, data) => ({ ...data })),
      getRepository: jest.fn().mockReturnValue({
        findAll: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((data) => ({ ...data })),
        persistAndFlush: jest.fn().mockResolvedValue(undefined),
        removeAndFlush: jest.fn().mockResolvedValue(undefined),
      }),
      clear: jest.fn(),
    };

    const mockORM = {
      em: mockEntityManager,
      getRepository: jest.fn().mockReturnValue({
        findAll: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((data) => ({ ...data })),
        persistAndFlush: jest.fn().mockResolvedValue(undefined),
        removeAndFlush: jest.fn().mockResolvedValue(undefined),
      }),
    };

    testingModuleBuilder.overrideProvider(MikroORM).useValue(mockORM);
  }

  // 추가 오버라이드 적용
  if (options.overrideProviders) {
    for (const override of options.overrideProviders) {
      testingModuleBuilder.overrideProvider(override.provide).useValue(override.useValue);
    }
  }

  // 모듈 컴파일 및 앱 생성
  const moduleFixture = await testingModuleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  // 실제 애플리케이션과 동일한 설정 적용
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return { app, moduleFixture };
}

/**
 * 테스트용 사용자를 생성하고 JWT 토큰을 발급하는 유틸리티 함수
 */
export async function createTestUserAndToken(
  moduleFixture: TestingModule,
  email: string,
  role: UserRole,
  name: string = '테스트 사용자',
): Promise<{ user: User; token: string }> {
  const userService = moduleFixture.get<UserService>(UserService);
  const jwtService = moduleFixture.get<JwtService>(JwtService);

  // 기존 사용자 확인 또는 새로 생성
  let user: User;
  try {
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      user = existingUser;
    } else {
      user = await userService.create({
        email,
        password: 'password123',
        name,
        role,
      });
    }

    // JWT 토큰 생성
    const token = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

/**
 * 테스트용 판매자를 생성하는 유틸리티 함수
 */
export async function createTestSeller(
  moduleFixture: TestingModule,
  email: string = 'test-seller@example.com',
  name: string = '테스트 판매자',
): Promise<User> {
  const { user } = await createTestUserAndToken(moduleFixture, email, UserRole.SELLER, name);
  return user;
}

/**
 * 테스트용 일반 사용자를 생성하는 유틸리티 함수
 */
export async function createTestViewer(
  moduleFixture: TestingModule,
  email: string = 'test-viewer@example.com',
  name: string = '테스트 뷰어',
): Promise<User> {
  const { user } = await createTestUserAndToken(moduleFixture, email, UserRole.VIEWER, name);
  return user;
}

/**
 * 테스트용 관리자를 생성하는 유틸리티 함수
 */
export async function createTestAdmin(
  moduleFixture: TestingModule,
  email: string = 'test-admin@example.com',
  name: string = '테스트 관리자',
): Promise<User> {
  const { user } = await createTestUserAndToken(moduleFixture, email, UserRole.ADMIN, name);
  return user;
}

/**
 * 테스트 실행 후 정리 작업을 수행하는 유틸리티 함수
 */
export async function tearDownE2ETest(app: INestApplication): Promise<void> {
  await app.close();
}

/**
 * 테스트용 JWT 토큰 생성 함수
 */
export function generateTestToken(
  jwtService: JwtService,
  userId = 'test-user-id',
  email = 'test@example.com',
  role = UserRole.VIEWER,
): string {
  return jwtService.sign({
    sub: userId,
    email,
    role,
  });
}

/**
 * JWT 인증 전략 모킹 헬퍼
 * E2E 테스트에서 인증이 필요한 API를 테스트할 때 사용
 */
export function mockJwtStrategy(moduleRef) {
  const mockJwtStrategy = {
    name: 'jwt',
    validate: jest.fn().mockImplementation((payload) => {
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }),
  };

  return moduleRef.overrideProvider('JwtStrategy').useValue(mockJwtStrategy);
}

/**
 * Passport 모듈 모킹 헬퍼
 * 인증이 필요한 E2E 테스트에서 사용
 */
export function mockPassportModule(moduleRef) {
  const mockAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();

      // Authorization 헤더에서 토큰 추출
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return false;
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return false;
      }

      try {
        // 테스트용 JWT 서비스
        const jwtService = new JwtService({ secret: 'test-secret' });
        const payload = jwtService.verify(token);

        // 사용자 정보를 요청 객체에 추가
        req.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        };

        return true;
      } catch (error) {
        return false;
      }
    }),
  };

  return moduleRef
    .overrideGuard('JwtAuthGuard')
    .useValue(mockAuthGuard)
    .overrideGuard('RolesGuard')
    .useValue({
      canActivate: jest.fn().mockReturnValue(true),
    });
}
