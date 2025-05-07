import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthControllerModule } from './api/auth/auth-controller.module';
import { HealthControllerModule } from './api/health/health-controller.module';
import { UserControllerModule } from './api/user/user-controller.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthControllerModule,
    UserControllerModule,
    AuthControllerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
