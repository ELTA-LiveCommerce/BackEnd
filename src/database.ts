import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';

import config from './infra/database/mikro-orm.config';

const IS_PROD = process.env.NODE_ENV === 'production';

export async function initDatabase() {
  const orm = await MikroORM.init(config);

  Logger.log('INITIALIZING DATABASE...', 'Database');
  Logger.verbose(await orm.checkConnection(), 'Database');

  const migrator = orm.getMigrator();
  try {
    await migrator.createMigration();
    await migrator.up();
    if (IS_PROD) {
      // await orm.getSeeder().seed(ProdCr000VariableSeeder);
      // await orm.getSeeder().seed(ProdCr001UserSeeder);
      // await orm.getSeeder().seed(ProdCr002TtpSeeder);
    } else {
      //   await orm.getSeeder().seed(Dev006CTFSeeder);
      //   await orm.getSeeder().seed(Dev007WargameSeeder);
    }
  } catch (e: unknown) {
    Logger.error('Error while initializing database', (e as Error).stack, 'Database');
  } finally {
    await orm.close(true);
  }
}
