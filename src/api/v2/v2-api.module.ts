import { Module } from '@nestjs/common';

import { AuthControllerModule } from './auth/auth-controller.module';
import { HealthControllerModule } from './health/health-controller.module';
import { ViewerControllerModule } from './viewer/viewer-controller.module';
import { AnnouncementControllerModule } from './announcement/announcement-controller.module';
import { SellerControllerModule } from './seller/seller-controller.module';
import { UserControllerModule } from './user/user-controller.module';

@Module({
  imports: [
    AnnouncementControllerModule,
    AuthControllerModule,
    HealthControllerModule,
    SellerControllerModule,
    UserControllerModule,
    ViewerControllerModule,
    // 앞으로 추가될 다른 v2 API 모듈들이 여기에 추가됩니다.
  ],
})
export class V2ApiModule {}
