import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { DeliveryStatus } from '../entity/delivery.entity';

export class CreateDeliveryDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUUID()
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
