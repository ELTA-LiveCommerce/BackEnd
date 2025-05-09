import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { RefundReason, RefundStatus } from '../entity/refund.entity';

export class CreateRefundDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUUID()
  paymentId: string;

  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsNotEmpty()
  @IsEnum(RefundReason)
  reason: RefundReason;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
