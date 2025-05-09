// import { Logger as MikroOrmLogger, Options, LogLevel } from '@mikro-orm/core'; // 임시 주석
import { JSMigrationGenerator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { PostgreSqlOptions } from '@mikro-orm/postgresql/PostgreSqlMikroORM';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
// import { Logger as NestJsLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 타입 정의
type MikroOrmOptions = {
  strict?: boolean;
  allowGlobalContext?: boolean;
  entities?: string[];
  entitiesTs?: string[];
  debug?: boolean;
  highlighter?: any;
  migrations?: {
    path: string;
    glob: string;
  };
  dbName?: string;
  type?: string;
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  forceUtcTimezone?: boolean;
  driver?: any;
};

// CustomMikroOrmLogger 클래스 임시 주석
// class CustomMikroOrmLogger extends MikroOrmLogger { ... }

// MikroORM 설정을 생성하는 함수
const createMikroOrmConfig = (configService?: ConfigService) => {
  const environment = process.env.NODE_ENV || 'development';

  const baseConfig: PostgreSqlOptions = {
    strict: true,
    allowGlobalContext: process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT === 'true',
    entities: ['dist/module/**/*.entity.js'],
    entitiesTs: ['src/module/**/*.entity.ts'],
    debug: true,
    highlighter: new SqlHighlighter(),
    migrations: {
      path: './dist/migrations',
      generator: JSMigrationGenerator,
      glob: '!(*.d).{js,ts}',
    },
  };

  const envConfigs = {
    test: {
      dbName: configService?.get<string>('POSTGRES_DB') || process.env.POSTGRES_DB || 'elta_test',
      user: configService?.get<string>('POSTGRES_USER') || process.env.POSTGRES_USER || 'elta',
      password: configService?.get<string>('POSTGRES_PASSWORD') || process.env.POSTGRES_PASSWORD || 'elta1234',
      host: configService?.get<string>('POSTGRES_HOST') || process.env.POSTGRES_HOST || 'postgres-dev',
      port: configService?.get<number>('POSTGRES_PORT') || Number(process.env.POSTGRES_PORT) || 5432,
      forceUtcTimezone: true,
      debug: false,
    },
    development: {
      dbName: configService?.get<string>('POSTGRES_DB') || process.env.POSTGRES_DB || 'elta',
      user: configService?.get<string>('POSTGRES_USER') || process.env.POSTGRES_USER || 'elta',
      password: configService?.get<string>('POSTGRES_PASSWORD') || process.env.POSTGRES_PASSWORD || 'elta1234',
      host: configService?.get<string>('POSTGRES_HOST') || process.env.POSTGRES_HOST || 'postgres-dev',
      port: configService?.get<number>('POSTGRES_PORT') || Number(process.env.POSTGRES_PORT) || 5432,
      forceUtcTimezone: true,
    },
    production: {
      dbName: configService?.get<string>('POSTGRES_DB') || process.env.POSTGRES_DB,
      user: configService?.get<string>('POSTGRES_USER') || process.env.POSTGRES_USER,
      password: configService?.get<string>('POSTGRES_PASSWORD') || process.env.POSTGRES_PASSWORD,
      host: configService?.get<string>('POSTGRES_HOST') || process.env.POSTGRES_HOST || 'postgres',
      port: configService?.get<number>('POSTGRES_PORT') || Number(process.env.POSTGRES_PORT) || 5432,
      forceUtcTimezone: true,
      debug: false,
    },
  };

  return defineConfig({
    ...baseConfig,
    ...envConfigs[environment],
  });
};

export default createMikroOrmConfig;
