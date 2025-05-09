import { IsEnum, IsOptional, IsString } from 'class-validator';

import { RefundStatus } from '../entity/refund.entity';

export class UpdateRefundDto {
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
