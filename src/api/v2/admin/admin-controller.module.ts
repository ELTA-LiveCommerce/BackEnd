import { Module } from '@nestjs/common';
import { AdminUserControllerModule } from './user/admin-user-controller.module';
import { AdminProductControllerModule } from './product/admin-product-controller.module';
import { AdminOrderControllerModule } from './order/admin-order-controller.module';
import { AdminDepositControllerModule } from './deposit/admin-deposit-controller.module';
import { AdminStatisticsControllerModule } from './statistics/admin-statistics-controller.module';

@Module({
  imports: [
    AdminUserControllerModule,
    AdminProductControllerModule,
    AdminOrderControllerModule,
    AdminDepositControllerModule,
    AdminStatisticsControllerModule,
  ],
})
export class AdminControllerModule {}

