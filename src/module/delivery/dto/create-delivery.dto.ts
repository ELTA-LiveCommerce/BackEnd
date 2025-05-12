import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DeliveryStatus } from '../entity/delivery.entity';

export class CreateDeliveryDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsEnum(DeliveryStatus)
  @IsOptional()
  status?: DeliveryStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  courierCompany?: string;

  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  recipientPhoneNumber: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}
