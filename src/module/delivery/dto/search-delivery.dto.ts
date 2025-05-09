import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { DeliveryStatus } from '../entity/delivery.entity';

export class SearchDeliveryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
