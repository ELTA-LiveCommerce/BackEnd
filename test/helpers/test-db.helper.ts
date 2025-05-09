/**
 * EntityManager의 모든 메서드를 성공적으로 모킹하기 위한 헬퍼 파일
 */

import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { KakaoStrategy } from '@/module/auth/strategies/kakao.strategy';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

// MikroORM allowGlobalContext 옵션 추가
export const mikroormOptions = {
  allowGlobalContext: true, // 글로벌 컨텍스트를 허용하도록 설정
};

// 모킹된 QueryBuilder
const createMockQueryBuilder = () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getResultList: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    getSingleResult: jest.fn().mockResolvedValue(null),
    execute: jest.fn().mockResolvedValue([]),
    getResultAndCount: jest.fn().mockResolvedValue([[], 0]), // 결과와 카운트를 함께 반환
  };
  return mockQueryBuilder;
};

// 데이터베이스 모킹을 위한 설정
const mockRepositoryMethods = {
  findAll: jest.fn().mockImplementation(() => []),
  findOne: jest.fn().mockImplementation(() => null),
  find: jest.fn().mockImplementation(() => []),
  persistAndFlush: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  persist: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  flush: jest.fn().mockImplementation(() => Promise.resolve()),
  removeAndFlush: jest.fn().mockImplementation(() => Promise.resolve()),
  getReference: jest.fn().mockImplementation((entityClass, id) => {
    const entity = new entityClass();
    entity.id = id;
    return entity;
  }),
  count: jest.fn().mockResolvedValue(0),
};

// 모킹된 EntityManager 생성
const createMockEntityManager = () => {
  return {
    ...mockRepositoryMethods,
    getRepository: jest.fn().mockImplementation(() => mockRepositoryMethods),
    fork: jest.fn().mockImplementation(() => createMockEntityManager()),
    clear: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    begin: jest.fn(),
    // transactional 메서드 추가
    transactional: jest.fn().mockImplementation((callback) => {
      return callback(createMockEntityManager());
    }),
    // createQueryBuilder 메서드 추가
    createQueryBuilder: jest.fn().mockImplementation(() => createMockQueryBuilder()),
    // assign 메서드 추가
    assign: jest.fn().mockImplementation((target, source) => {
      return { ...target, ...source };
    }),
  };
};

// 모킹된 MikroORM 생성
const createMockORM = () => {
  const mockEM = createMockEntityManager() as unknown as EntityManager;
  return {
    em: {
      ...mockEM,
      fork: jest.fn().mockImplementation(() => mockEM),
      transactional: jest.fn().mockImplementation((callback) => {
        return callback(mockEM);
      }),
    },
    getSchemaGenerator: jest.fn().mockImplementation(() => ({
      dropSchema: jest.fn().mockResolvedValue(undefined),
      createSchema: jest.fn().mockResolvedValue(undefined),
    })),
    close: jest.fn().mockResolvedValue(undefined),
  };
};

// 기본 테스트 사용자 생성
export const createTestUser = () => {
  const user = new User();
  user.id = 'test-user-id';
  user.email = 'test@example.com';
  user.name = '테스트 사용자';
  user.role = UserRole.VIEWER;
  user.password = 'TestPass1!';
  user.isVerified = true;
  user.createdAt = new Date();
  user.updatedAt = new Date();
  return user;
};

// 모킹된 KakaoStrategy 생성
class MockKakaoStrategy {
  authenticate() {
    return null;
  }
  validate() {
    return null;
  }
}

// 더 정확한 JwtAuthGuard 모킹
class MockJwtAuthGuard extends JwtAuthGuard {
  canActivate() {
    return true;
  }

  handleRequest() {
    return createTestUser();
  }
}

// 테스트 모듈과 앱을 설정하는 함수 (모킹된 DB 사용)
export async function setupTestApp(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
  orm: MikroORM;
  em: EntityManager;
}> {
  // 환경 변수 설정 (테스트 환경)
  process.env.NODE_ENV = 'test';
  process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = 'true';

  // 카카오 인증 관련 환경 변수 설정
  process.env.KAKAO_CLIENT_ID = 'test-client-id';
  process.env.KAKAO_CALLBACK_URL = 'http://localhost:3000/auth/kakao/callback';

  // MikroORM을 모킹하기 위한 설정
  const mockORM = createMockORM() as unknown as MikroORM;
  const mockEM = createMockEntityManager() as unknown as EntityManager;

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .overrideGuard(RolesGuard)
    .useValue({
      canActivate: () => true,
      // 가드에서 컨텍스트 추출 과정에서도 사용자 정보 주입
      getRequest: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = createTestUser();
        return request;
      },
    })
    .overrideProvider(MikroORM)
    .useValue(mockORM)
    // KakaoStrategy 모킹
    .overrideProvider(KakaoStrategy)
    .useClass(MockKakaoStrategy)
    .compile();

  const app = moduleFixture.createNestApplication();

  // 모든 요청에 사용자 정보 추가
  app.use((req, res, next) => {
    req.user = createTestUser();
    next();
  });

  await app.init();

  return { app, moduleFixture, orm: mockORM, em: mockEM };
}

// 테스트 종료 시 앱 정리
export async function cleanupTestApp(app: INestApplication, orm?: MikroORM): Promise<void> {
  if (orm) {
    try {
      await orm.close();
    } catch (error) {
      console.error('Error closing ORM:', error);
    }
  }
  if (app) {
    await app.close();
  }
}
