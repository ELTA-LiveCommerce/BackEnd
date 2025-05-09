import { Module } from '@nestjs/common';

import { AdminControllerModule } from './admin/admin-controller.module';
import { AuthControllerModule } from './auth/auth-controller.module';
import { BroadcastControllerModule } from './broadcast/broadcast-controller.module';
import { DeliveryControllerModule } from './delivery/delivery-controller.module';
import { FileControllerModule } from './file/file-controller.module';
import { HealthControllerModule } from './health/health-controller.module';
import { OrderControllerModule } from './order/order-controller.module';
import { PaymentControllerModule } from './payment/payment-controller.module';
import { ProductControllerModule } from './product/product-controller.module';
import { UserControllerModule } from './user/user-controller.module';

@Module({
  imports: [
    AdminControllerModule,
    AuthControllerModule,
    BroadcastControllerModule,
    DeliveryControllerModule,
    FileControllerModule,
    HealthControllerModule,
    OrderControllerModule,
    PaymentControllerModule,
    ProductControllerModule,
    UserControllerModule,
  ],
})
export class V1ApiModule {}
