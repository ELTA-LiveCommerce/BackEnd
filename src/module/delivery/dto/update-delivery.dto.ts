import { IsEnum, IsOptional, IsString } from 'class-validator';

import { DeliveryStatus } from '../entity/delivery.entity';

export class UpdateDeliveryDto {
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  courierCompany?: string;
}
