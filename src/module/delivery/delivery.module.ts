import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { DeliveryService } from './delivery.service';
import { Delivery } from './entity/delivery.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Delivery])],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
