import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Order } from './entity/order.entity';
import { ReturnRequest } from './entity/return-request.entity';
import { ReturnRequestService } from './return-request.service';

@Module({
  imports: [MikroOrmModule.forFeature([ReturnRequest, Order])],
  providers: [ReturnRequestService],
  exports: [ReturnRequestService],
})
export class ReturnRequestModule {}
