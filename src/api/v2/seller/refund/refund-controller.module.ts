import { Module } from '@nestjs/common';

import { RefundModule } from '@/module/refund/refund.module';

import { RefundController } from './refund.controller';

@Module({
  imports: [RefundModule],
  controllers: [RefundController],
})
export class RefundControllerModule {}
