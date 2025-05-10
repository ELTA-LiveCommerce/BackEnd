/**
 * E2E 테스트 종료 후 정리
 */
import { Logger } from '@nestjs/common';

/**
 * Jest 전역 정리 - 테스트 종료 후에 실행
 */
export default async function teardown(): Promise<void> {
  Logger.log('E2E 테스트 환경 정리 - 리소스 해제', 'Test Teardown');

  if (global.__ORM_INSTANCE__) {
    Logger.verbose('데이터베이스 연결 종료', 'Test Teardown');
    await global.__ORM_INSTANCE__.close(true);
    global.__ORM_INSTANCE__ = null;
  }
}
