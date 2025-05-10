/**
 * E2E 테스트 실행 전 초기화
 */
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Test000UserSeeder 임포트 (경로 확인 필요, src/infra/database/seeders/test000-user.seeder와 유사할 것으로 예상)
import createMikroOrmConfig from '@/infra/database/mikro-orm.config';
import { Test000UserSeeder } from '@/infra/database/seeders/test000-user.seeder';

// 전역 변수로 ORM 인스턴스 저장
declare global {
  // eslint-disable-next-line no-var
  var __ORM_INSTANCE__: MikroORM | null;
}

global.__ORM_INSTANCE__ = null;

/**
 * Jest 전역 설정 - 테스트 시작 전에 실행
 */
export default async function setup(): Promise<void> {
  Logger.log('E2E 테스트 환경 설정 - 데이터베이스 초기화 시작', 'Test Setup');

  const configService = new ConfigService();
  const mikroOrmConfig = createMikroOrmConfig(configService);
  const orm = await MikroORM.init(mikroOrmConfig);

  Logger.verbose('데이터베이스 연결 확인', 'Test Setup');
  Logger.verbose(await orm.checkConnection(), 'Test Setup');

  try {
    const schemaGenerator = orm.getSchemaGenerator();
    const connection = orm.em.getConnection();

    Logger.log('데이터베이스 스키마 재생성', 'Test Setup');

    // 1. ORM을 사용하여 스키마의 테이블들을 드롭합니다.
    await schemaGenerator.dropSchema();
    Logger.log('ORM을 통해 테이블 드롭 완료', 'Test Setup');

    // 3. ORM 메타데이터를 기반으로 스키마를 새로 생성합니다.
    await schemaGenerator.createSchema();
    Logger.log('ORM을 통해 스키마 생성 완료', 'Test Setup');

    // 4. 스키마를 최신 상태로 업데이트 (선택 사항, createSchema()로 충분할 수 있음)
    await schemaGenerator.updateSchema();
    Logger.log('ORM을 통해 스키마 업데이트 완료', 'Test Setup');

    // 5. 테스트용 시드 데이터 생성 (클래스 기반 시더 사용)
    Logger.log('클래스 기반 시더를 사용하여 테스트 데이터 생성 중...', 'Test Setup');
    await orm.getSeeder().seed(Test000UserSeeder);
    Logger.log('테스트 데이터 생성 완료', 'Test Setup');

    Logger.log('테스트 데이터베이스 초기화 완료', 'Test Setup');

    global.__ORM_INSTANCE__ = orm;
  } catch (error) {
    Logger.error('테스트 데이터베이스 초기화 중 오류 발생:', error, 'Test Setup');
    await orm.close(true);
    throw error;
  }
}
