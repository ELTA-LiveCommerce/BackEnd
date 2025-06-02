import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Order } from './entity/order.entity';
import { ReturnRequest } from './entity/return-request.entity';
import { ReturnRequestService } from './return-request.service';
import { PaymentModule } from '../payment/payment.module';
import { RefundEntity } from '../refund/entity/refund.entity';

@Module({
  imports: [MikroOrmModule.forFeature([ReturnRequest, Order, RefundEntity]), PaymentModule],
  providers: [ReturnRequestService],
  exports: [ReturnRequestService],
})
export class ReturnRequestModule {}
