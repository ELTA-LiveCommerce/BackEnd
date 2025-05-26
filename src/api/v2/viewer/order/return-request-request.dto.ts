import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReturnPickupType } from '@/shared/enum/return-pickup-type.enum';
import { ReturnReasonCategory, ReturnReasonDetail } from '@/shared/enum/return-reason.enum';

export class CreateReturnRequestRequest {
  @ApiProperty({ description: '주문 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  @IsNotEmpty()
  @IsUUID()
  orderId!: string;

  @ApiProperty({ enum: ReturnReasonCategory, description: '반품 사유 카테고리' })
  @IsNotEmpty()
  @IsEnum(ReturnReasonCategory)
  reasonCategory!: ReturnReasonCategory;

  @ApiProperty({ enum: ReturnReasonDetail, description: '반품 사유 상세' })
  @IsNotEmpty()
  @IsEnum(ReturnReasonDetail)
  reasonDetail!: ReturnReasonDetail;

  @ApiProperty({ enum: ReturnPickupType, description: '회수 요청 방법' })
  @IsNotEmpty()
  @IsEnum(ReturnPickupType)
  pickupType!: ReturnPickupType;

  @ApiProperty({ description: '회수 요청 상세 사항', required: false, example: '경비실에 맡겨주세요' })
  @IsOptional()
  @IsString()
  pickupNote?: string;
}
