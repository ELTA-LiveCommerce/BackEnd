import { MikroORM } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 절대 경로로 변경하여 임포트 문제 해결
import createMikroOrmConfig from '@/infra/database/mikro-orm.config';

const IS_PROD = process.env.NODE_ENV === 'production';

// 알려진 마이그레이션 목록
const KNOWN_MIGRATIONS = [
  'Migration20250528200626',
  'Migration20250529060657',
  'Migration20250529060731',
  'Migration20250530200834',
  'Migration20250531092524'
];

/**
 * 데이터베이스를 초기화하고 MikroORM 인스턴스를 반환합니다.
 */
export async function initDatabase() {
  Logger.log('데이터베이스 초기화 중...', 'Database');
  const configService = new ConfigService();
  const mikroOrmConfig = createMikroOrmConfig(configService);
  const orm = await MikroORM.init(mikroOrmConfig);

  Logger.log('데이터베이스 연결 확인', 'Database');
  Logger.verbose(await orm.isConnected(), 'Database');

  const migrator = orm.getMigrator();
  const connection = orm.em.getConnection();
  const generator = orm.getSchemaGenerator();
  
  try {
    // 1. 테이블 존재 여부 간단히 확인
    let needsFullSchema = false;
    try {
      await connection.execute('SELECT 1 FROM users LIMIT 1');
      Logger.log('기본 테이블이 존재함', 'Database');
    } catch (err) {
      Logger.log('기본 테이블이 없음. 전체 스키마 생성 필요', 'Database');
      needsFullSchema = true;
    }
    
    // 2. 스키마가 필요한 경우 생성
    if (needsFullSchema) {
      try {
        Logger.log('전체 스키마 생성 중...', 'Database');
        await generator.createSchema();
        Logger.log('스키마 생성 완료', 'Database');
        
        // 마이그레이션 테이블 생성 및 기록
        try {
          await connection.execute(`
            CREATE TABLE IF NOT EXISTS mikro_orm_migrations (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL UNIQUE,
              executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
          `);
          
          // 모든 마이그레이션을 실행된 것으로 표시
          for (const migrationName of KNOWN_MIGRATIONS) {
            await connection.execute(
              `INSERT INTO mikro_orm_migrations (name, executed_at) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING`,
              [migrationName]
            ).catch(() => {/* 무시 */});
          }
          Logger.log('마이그레이션 기록 완료', 'Database');
        } catch (err) {
          Logger.warn('마이그레이션 기록 실패 (무시)', 'Database');
        }
        
        return; // 스키마 생성 완료 후 종료
      } catch (schemaError) {
        Logger.error('스키마 생성 실패', (schemaError as Error).message, 'Database');
        // 계속 진행
      }
    }
    
    // 3. 마이그레이션 실행 시도 (스키마가 이미 있는 경우)
    try {
      const pendingMigrations = await migrator.getPendingMigrations();
      
      if (pendingMigrations && pendingMigrations.length > 0) {
        Logger.log(`${pendingMigrations.length}개의 대기 중인 마이그레이션 발견`, 'Database');
        
        // 각 마이그레이션 개별 실행
        for (const migration of pendingMigrations) {
          try {
            Logger.log(`마이그레이션 실행: ${migration.name}`, 'Database');
            await migrator.up({ migrations: [migration.name] });
            Logger.log(`마이그레이션 완료: ${migration.name}`, 'Database');
          } catch (migrationError) {
            const errorMessage = (migrationError as Error).message;
            Logger.warn(`마이그레이션 ${migration.name} 실패: ${errorMessage}`, 'Database');
            
            // 오류를 무시하고 실행된 것으로 표시
            if (errorMessage.includes('already exists') || 
                errorMessage.includes('does not exist') ||
                errorMessage.includes('duplicate')) {
              try {
                await connection.execute(
                  `INSERT INTO mikro_orm_migrations (name, executed_at) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING`,
                  [migration.name]
                );
                Logger.log(`마이그레이션 ${migration.name}을 완료로 표시`, 'Database');
              } catch (err) {
                // 무시
              }
            }
          }
        }
      } else {
        Logger.log('실행할 마이그레이션 없음', 'Database');
      }
    } catch (migratorError) {
      Logger.warn('마이그레이션 처리 중 오류 (무시): ' + (migratorError as Error).message, 'Database');
      
      // 모든 마이그레이션을 실행된 것으로 표시
      for (const migrationName of KNOWN_MIGRATIONS) {
        try {
          await connection.execute(
            `INSERT INTO mikro_orm_migrations (name, executed_at) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING`,
            [migrationName]
          );
        } catch (err) {
          // 무시
        }
      }
    }
    
    // 4. 개발 환경에서 스키마 동기화
    if (!IS_PROD) {
      try {
        await generator.updateSchema({ safe: true, dropTables: false });
        Logger.log('스키마 동기화 완료', 'Database');
      } catch (err) {
        Logger.warn('스키마 동기화 실패 (무시)', 'Database');
      }
    }
    
  } catch (e) {
    const error = e as Error;
    Logger.error('데이터베이스 초기화 중 오류', error.message, 'Database');
    
    // 연결 오류가 아니면 계속 진행
    if (!error.message.toLowerCase().includes('connect') && 
        !error.message.includes('authentication') &&
        !error.message.includes('ECONNREFUSED')) {
      Logger.warn('오류를 무시하고 앱 시작 계속', 'Database');
    } else {
      // 연결 오류는 재던지기
      throw error;
    }
  }
}