import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DeliveryStatus } from '../entity/delivery.entity';

export class CreateDeliveryDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  courierCompany?: string;

  @IsNotEmpty()
  @IsString()
  shippingAddress: string;
}
