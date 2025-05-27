require('dotenv').config();
require('ts-node/register');
require('tsconfig-paths/register');

const { JSMigrationGenerator } = require('@mikro-orm/migrations');
const { PostgreSqlDriver } = require('@mikro-orm/postgresql');
const { SqlHighlighter } = require('@mikro-orm/sql-highlighter');

module.exports = {
  driver: PostgreSqlDriver,
  entities: ['./dist/**/*.entity.js', '!./dist/shared/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts', '!./src/shared/**/*.entity.ts'],
  strict: true,
  allowGlobalContext: process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT === 'true',
  debug: true,
  highlighter: new SqlHighlighter(),
  migrations: {
    path: './src/infra/database/migrations',
    pathTs: './src/infra/database/migrations',
    generator: JSMigrationGenerator,
    glob: '!(*.d).{js,ts}',
  },
  seeder: {
    path: './dist/infra/database/seeders',
    pathTs: './src/infra/database/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
    fileName: (className) => className,
  },
  // 환경별 데이터베이스 설정
  dbName: process.env.DB_DATABASE || 'elta_dev',
  user: process.env.DB_USERNAME || 'elta',
  password: process.env.DB_PASSWORD || 'elta1234',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  forceUtcTimezone: true,
};

