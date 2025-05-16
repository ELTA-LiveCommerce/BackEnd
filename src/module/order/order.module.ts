import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { DeliveryModule } from '@/module/delivery/delivery.module';
import { PaymentModule } from '@/module/payment/payment.module';
import { Product } from '@/module/product/entity/product.entity';
import { ProductModule } from '@/module/product/product.module';
import { User } from '@/module/user/entity/user.entity';
import { NotificationModule } from '@/module/notification/notification.module';

import { OrderItem } from './entity/order-item.entity';
import { Order } from './entity/order.entity';
import { OrderService } from './order.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Order, OrderItem, Product, User]),
    ProductModule,
    DeliveryModule,
    PaymentModule,
    NotificationModule,
  ],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

