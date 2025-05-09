import { MikroOrmModule, MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdminControllerModule } from '@/api/admin/admin-controller.module';
import { AuthControllerModule } from '@/api/auth/auth-controller.module';
import { BroadcastControllerModule } from '@/api/broadcast/broadcast-controller.module';
import { DeliveryControllerModule } from '@/api/delivery/delivery-controller.module';
import { HealthControllerModule } from '@/api/health/health-controller.module';
import { OrderControllerModule } from '@/api/order/order-controller.module';
import { PaymentControllerModule } from '@/api/payment/payment-controller.module';
import { ProductControllerModule } from '@/api/product/product-controller.module';
import { UserControllerModule } from '@/api/user/user-controller.module';
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
    HealthControllerModule,
    UserControllerModule,
    AuthControllerModule,
    ProductControllerModule,
    OrderControllerModule,
    BroadcastControllerModule,
    DeliveryControllerModule,
    PaymentControllerModule,
    AdminControllerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
