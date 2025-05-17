import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { RefundStatus } from '@/shared/enum/refund-status.enum';

export class SellerRefundStatusUpdateDto {
  @ApiProperty({
    description: '변경할 반품 상태',
    enum: RefundStatus,
    example: RefundStatus.PROCESSING,
  })
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @ApiProperty({
    description: '상태 변경 사유 또는 메모',
    required: false,
    example: '배송 업체에서 수거 진행 중입니다.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}
