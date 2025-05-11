import { Module } from '@nestjs/common';

import { HealthControllerModule } from './health/health-controller.module';
import { ViewerControllerModule } from './viewer/viewer-controller.module';
import { AuthControllerModule } from './auth/auth-controller.module';

@Module({
  imports: [
    HealthControllerModule,
    ViewerControllerModule,
    AuthControllerModule,
    // 앞으로 추가될 다른 v2 API 모듈들이 여기에 추가됩니다.
  ],
})
export class V2ApiModule {}
