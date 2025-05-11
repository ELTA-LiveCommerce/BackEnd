import { MikroOrmModule, MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { V1ApiModule } from '@/api/v1/v1-api.module';
import { V2ApiModule } from '@/api/v2/v2-api.module';
import configuration from '@/infra/config/configuration';
import { validationSchema } from '@/infra/config/validation.schema';
import createMikroOrmConfig from '@/infra/database/mikro-orm.config';

declare global {
  var __ORM_CONFIG__: any | null;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [configuration],
      validationSchema,
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): MikroOrmModuleOptions => {
        if (process.env.NODE_ENV === 'test' && global.__ORM_CONFIG__) {
          return global.__ORM_CONFIG__ as MikroOrmModuleOptions;
        }
        const config = createMikroOrmConfig(configService);
        return config as MikroOrmModuleOptions;
      },
      inject: [ConfigService],
    }),
    V1ApiModule,
    V2ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
