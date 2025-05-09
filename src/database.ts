import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import createMikroOrmConfig from './infra/database/mikro-orm.config';

const IS_PROD = process.env.NODE_ENV === 'production';

export async function initDatabase() {
  const configService = new ConfigService();
  const mikroOrmConfig = createMikroOrmConfig(configService);
  const orm = await MikroORM.init(mikroOrmConfig);

  Logger.log('INITIALIZING DATABASE...', 'Database');
  Logger.verbose(await orm.checkConnection(), 'Database');

  const migrator = orm.getMigrator();
  try {
    await migrator.createMigration();
    await migrator.up();
    if (IS_PROD) {
    } else {
    }
  } catch (e: unknown) {
    Logger.error('Error while initializing database', (e as Error).stack, 'Database');
  } finally {
    await orm.close(true);
  }
}
