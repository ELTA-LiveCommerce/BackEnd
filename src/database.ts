import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 절대 경로로 변경하여 임포트 문제 해결
import createMikroOrmConfig from '@/infra/database/mikro-orm.config';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * 데이터베이스를 초기화하고 MikroORM 인스턴스를 반환합니다.
 */
export async function initDatabase() {
  Logger.log('데이터베이스 초기화 중...', 'Database');
  const configService = new ConfigService();
  const mikroOrmConfig = createMikroOrmConfig(configService);
  const orm = await MikroORM.init(mikroOrmConfig);

  Logger.log('데이터베이스 연결 확인', 'Database');
  Logger.verbose(await orm.checkConnection(), 'Database');

  const migrator = orm.getMigrator();
  try {
    await migrator.createMigration();
    await migrator.up();
    if (IS_PROD) {
      // 프로덕션 환경 마이그레이션만 실행
    } else {
      // 개발 환경 마이그레이션 실행
    }
  } catch (e: unknown) {
    Logger.error('Error while initializing database', (e as Error).stack, 'Database');
    await orm.close(true);
  }
}
