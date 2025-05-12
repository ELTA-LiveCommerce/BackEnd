import { Module } from '@nestjs/common';

import { AuthControllerModule } from './auth/auth-controller.module';
// CommonControllerModuleV2는 현재 존재하지 않는 것으로 보이므로, 원래 없었다면 주석 처리하거나 삭제합니다.
// import { CommonControllerModuleV2 } from './common/common-controller.module';
import { HealthControllerModule } from './health/health-controller.module';
import { ViewerControllerModule } from './viewer/viewer-controller.module';
import { AnnouncementControllerModule } from './announcement/announcement-controller.module';
import { SellerControllerModule } from './seller/seller-controller.module';

@Module({
  imports: [
    AuthControllerModule,
    // CommonControllerModuleV2, // Common 모듈이 확실히 존재하고 V2 접미사가 맞다면 주석 해제
    HealthControllerModule,
    ViewerControllerModule,
    SellerControllerModule,
    AnnouncementControllerModule,
    // 앞으로 추가될 다른 v2 API 모듈들이 여기에 추가됩니다.
  ],
})
export class V2ApiModule {}
