import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { ReturnPickupType } from '@/shared/enum/return-pickup-type.enum';
import { ReturnReasonCategory, ReturnReasonDetail } from '@/shared/enum/return-reason.enum';

export class CreateReturnRequestDto {
  @IsNotEmpty()
  @IsUUID()
  orderId!: string;

  @IsNotEmpty()
  @IsEnum(ReturnReasonCategory)
  reasonCategory!: ReturnReasonCategory;

  @IsNotEmpty()
  @IsEnum(ReturnReasonDetail)
  reasonDetail!: ReturnReasonDetail;

  @IsNotEmpty()
  @IsString()
  pickupName!: string;

  @IsNotEmpty()
  @IsString()
  pickupAddress!: string;

  @IsNotEmpty()
  @IsEnum(ReturnPickupType)
  pickupType!: ReturnPickupType;

  @IsOptional()
  @IsString()
  pickupNote?: string;
}
