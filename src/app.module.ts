import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthControllerModule } from './api/health/health-controller.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthControllerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
