import { MikroOrmModule, MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { V1ApiModule } from '@/api/v1/v1-api.module';
import { V2ApiModule } from '@/api/v2/v2-api.module';
import createMikroOrmConfig from '@/infra/database/mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): MikroOrmModuleOptions => {
        return createMikroOrmConfig(configService);
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
