import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { DeliveryService } from './delivery.service';
import { Delivery } from './entity/delivery.entity';
import { Order } from '../order/entity/order.entity';
import { OrderItem } from '../order/entity/order-item.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Delivery, Order, OrderItem])],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
