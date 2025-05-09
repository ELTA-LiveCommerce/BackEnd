import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaymentStatus } from '../entity/payment.entity';

export class SearchPaymentDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
