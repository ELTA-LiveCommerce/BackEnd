import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { DeliveryService } from './delivery.service';
import { Delivery } from './entity/delivery.entity';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [MikroOrmModule.forFeature([Delivery]), OrderModule],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
