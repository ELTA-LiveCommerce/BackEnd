import { EntityManager, MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';

// MikroORM allowGlobalContext 옵션 추가
export const mikroormOptions = {
  allowGlobalContext: true, // 글로벌 컨텍스트를 허용하도록 설정
};

// 테스트 모듈과 앱을 설정하는 함수
export async function setupTestApp(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
  orm: MikroORM;
  em: EntityManager;
}> {
  // 환경 변수 설정 (테스트 환경)
  process.env.NODE_ENV = 'test';
  process.env.POSTGRES_DB = 'elta_test';
  process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = 'true';

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const orm = app.get<MikroORM>(MikroORM);

  // ORM이 이미 연결되어 있는지 확인
  try {
    // 테스트 데이터베이스 확인 및 스키마 초기화
    const generator = orm.getSchemaGenerator();
    await generator.dropSchema();
    await generator.createSchema();
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }

  // 엔티티 매니저 가져오기
  const em = orm.em.fork();

  return { app, moduleFixture, orm, em };
}

// 독립적인 MikroORM 인스턴스 생성 (테스트용)
export async function createTestORM(): Promise<MikroORM> {
  const configService = new ConfigService();

  return MikroORM.init<PostgreSqlDriver>({
    entities: ['./src/module/**/*.entity.ts', './src/infra/**/*.entity.ts'],
    dbName: 'elta_test',
    host: configService.get<string>('POSTGRES_HOST') || 'localhost',
    user: configService.get<string>('POSTGRES_USER') || 'elta',
    password: configService.get<string>('POSTGRES_PASSWORD') || 'elta1234',
    port: configService.get<number>('POSTGRES_PORT') || 5432,
    driver: PostgreSqlDriver,
    debug: true,
    forceUndefined: true,
  });
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
