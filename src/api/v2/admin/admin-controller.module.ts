import { Module } from '@nestjs/common';
import { AdminProductControllerModule } from './product/admin-product-controller.module';
import { AdminUserControllerModule } from './user/admin-user-controller.module';
import { AdminDeliveryControllerModule } from './delivery/admin-delivery-controller.module';
import { AdminStatisticsControllerModule } from './statistics/admin-statistics-controller.module';
import { AdminDepositControllerModule } from './deposit/admin-deposit-controller.module';
import { AdminOrderControllerModule } from './order/admin-order-controller.module';
import { AdminBroadcastControllerModule } from './broadcast/admin-broadcast-controller.module';
import { AdminFeeControllerModule } from './settings/admin-fee-controller.module';

@Module({
  imports: [
    AdminProductControllerModule,
    AdminUserControllerModule,
    AdminDeliveryControllerModule,
    AdminStatisticsControllerModule,
    AdminDepositControllerModule,
    AdminOrderControllerModule,
    AdminBroadcastControllerModule,
    AdminFeeControllerModule,
  ],
})
export class AdminControllerModule {}

