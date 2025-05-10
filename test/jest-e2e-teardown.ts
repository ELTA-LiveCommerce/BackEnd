/**
 * E2E 테스트 종료 후 정리
 */
import 'tsconfig-paths/register';
import { MikroORM } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';

/**
 * Jest 전역 정리 - 테스트 종료 후에 실행
 */
export default async function teardown(): Promise<void> {
  Logger.log('E2E 테스트 환경 정리 - 데이터베이스 연결 종료 시작', 'Test Teardown');
  try {
    if (global.__ORM_INSTANCE__) {
      Logger.verbose('ORM 인스턴스가 존재하여 연결을 종료합니다.', 'Test Teardown');
      if (await (global.__ORM_INSTANCE__ as MikroORM).isConnected?.()) {
        await (global.__ORM_INSTANCE__ as MikroORM).close(true);
        Logger.log('Jest globalTeardown ORM 연결 성공적으로 종료', 'Test Teardown');
        global.__ORM_INSTANCE__ = null;
      } else {
        Logger.log('Jest globalTeardown: ORM 인스턴스가 없거나 이미 연결이 끊겨있습니다.', 'Test Teardown');
        global.__ORM_INSTANCE__ = null;
      }
    } else {
      Logger.warn('ORM 인스턴스가 존재하지 않아 연결을 종료할 수 없습니다.', 'Test Teardown');
    }
  } catch (error) {
    Logger.error('Jest globalTeardown ORM 연결 종료 중 오류 발생:', error, 'Test Teardown');
    throw error;
  }
}
