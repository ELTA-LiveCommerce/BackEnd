import { JSMigrationGenerator, Migrator } from '@mikro-orm/migrations';
import {
  DefaultLogger,
  defineConfig,
  LoadStrategy,
  LogContext,
  LoggerNamespace,
  PostgreSqlDriver,
} from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { Logger } from '@nestjs/common';

class NestLogger extends DefaultLogger {
  log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    switch (context?.level) {
      case 'info':
        Logger.verbose(message, namespace);
        return;
      case 'warning':
        Logger.warn(message, context.error, namespace);
        return;
      case 'error':
        Logger.error(message, namespace);
        return;
      default:
        break;
    }
    Logger.log(message, namespace);
  }
}

export default defineConfig({
  entities: ['./dist/module/**/*.entity.js', './dist/infra/**/*.entity.js'],
  dbName: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
  driver: PostgreSqlDriver,
  debug: true,
  colors: true,
  highlighter: new SqlHighlighter(),
  loggerFactory: (options) => new NestLogger(options),
  loadStrategy: LoadStrategy.JOINED,
  migrations: {
    tableName: 'migrations',
    path: './dist/migrations',
    generator: JSMigrationGenerator,
  },

  extensions: [Migrator],
});
