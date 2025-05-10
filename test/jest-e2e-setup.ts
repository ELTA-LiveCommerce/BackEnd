import 'tsconfig-paths/register'; // 경로 별칭 등록을 위해 최상단에 추가

/**
 * E2E 테스트 실행 전 초기화
 */
// import { Options, MikroORM } from '@mikro-orm/core'; // Options 임포트 불필요
import { MikroORM } from '@mikro-orm/core';
// import { PostgreSqlDriver } from '@mikro-orm/postgresql'; // PostgreSqlDriver 임포트 불필요
// import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 경로 별칭 사용으로 복원
import createMikroOrmConfig from '@/infra/database/mikro-orm.config';
import { Test000UserSeeder } from '@/infra/database/seeders/test000-user.seeder';

// 전역 변수로 ORM 인스턴스 및 설정 저장
declare global {
  // eslint-disable-next-line no-var
  var __ORM_INSTANCE__: any | null; // 타입을 any | null 로 변경
  // eslint-disable-next-line no-var
  var __ORM_CONFIG__: any | null;
}

global.__ORM_INSTANCE__ = null;
global.__ORM_CONFIG__ = null; // 초기화

/**
 * Jest 전역 설정 - 테스트 시작 전에 실행
 */
export default async function setup(): Promise<void> {
  Logger.log('E2E 테스트 환경 설정 - 데이터베이스 초기화 시작', 'Test Setup');

  const configService = new ConfigService();
  const mikroOrmConfigForSetup = createMikroOrmConfig(configService);
  global.__ORM_CONFIG__ = mikroOrmConfigForSetup;

  Logger.debug(
    `Jest globalSetup: global.__ORM_CONFIG__.entities: ${JSON.stringify(global.__ORM_CONFIG__?.entities)}`,
    'Test Setup Config Debug',
  );
  Logger.debug(
    `Jest globalSetup: global.__ORM_CONFIG__.entitiesTs: ${JSON.stringify(global.__ORM_CONFIG__?.entitiesTs)}`,
    'Test Setup Config Debug',
  );

  Logger.log(
    `Jest globalSetup: Connecting to DB with name: ${mikroOrmConfigForSetup.dbName}, host: ${mikroOrmConfigForSetup.host}, port: ${mikroOrmConfigForSetup.port}`,
    'Test Setup',
  );
  const orm = await MikroORM.init(mikroOrmConfigForSetup as any);
  global.__ORM_INSTANCE__ = orm;

  Logger.verbose('데이터베이스 연결 확인', 'Test Setup');
  Logger.verbose(await orm.isConnected(), 'Test Setup');

  try {
    const schemaGenerator = orm.getSchemaGenerator();
    // const connection = orm.em.getConnection(); // 현재 사용되지 않음

    Logger.log('데이터베이스 스키마 재생성', 'Test Setup');

    await schemaGenerator.dropSchema();
    Logger.log('ORM을 통해 테이블 드롭 완료', 'Test Setup');

    await schemaGenerator.createSchema();
    Logger.log('ORM을 통해 스키마 생성 완료', 'Test Setup');

    await schemaGenerator.updateSchema();
    Logger.log('ORM을 통해 스키마 업데이트 완료', 'Test Setup');

    Logger.log('클래스 기반 시더를 사용하여 테스트 데이터 생성 중...', 'Test Setup');
    await orm.getSeeder().seed(Test000UserSeeder);
    Logger.log('테스트 데이터 생성 완료', 'Test Setup');

    Logger.log('테스트 데이터베이스 초기화 완료', 'Test Setup');
  } catch (error) {
    Logger.error('테스트 데이터베이스 초기화 중 오류 발생:', error, 'Test Setup');
    // 에러 발생 시에는 연결을 닫도록 유지
    if (global.__ORM_INSTANCE__ && (await global.__ORM_INSTANCE__.isConnected())) {
      await global.__ORM_INSTANCE__.close(true);
      Logger.log('Jest globalSetup ORM 연결 종료 (오류 발생)', 'Test Setup');
    }
    throw error;
  } finally {
    // globalSetup 완료 후 ORM 연결을 명시적으로 닫는 로직 제거 또는 주석 처리
    // if (global.__ORM_INSTANCE__ && (await global.__ORM_INSTANCE__.isConnected())) {
    //   await global.__ORM_INSTANCE__.close(true);
    //   Logger.log('Jest globalSetup ORM 연결 종료', 'Test Setup');
    // }
  }
}
