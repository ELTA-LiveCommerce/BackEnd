import { Module } from '@nestjs/common';

import { PaymentModule } from '@/module/payment/payment.module';

import { PaymentController } from './payment.controller';
import { RefundController } from './refund.controller';

@Module({
  imports: [PaymentModule],
  controllers: [PaymentController, RefundController],
})
export class PaymentControllerModule {}
