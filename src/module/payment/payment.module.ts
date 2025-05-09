import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Payment } from './entity/payment.entity';
import { Refund } from './entity/refund.entity';
import { PaymentService } from './payment.service';
import { RefundService } from './refund.service';

@Module({
  imports: [MikroOrmModule.forFeature([Payment, Refund])],
  providers: [PaymentService, RefundService],
  exports: [PaymentService, RefundService],
})
export class PaymentModule {}
