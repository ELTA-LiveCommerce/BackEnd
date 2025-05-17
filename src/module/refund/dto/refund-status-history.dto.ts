import { ApiProperty } from '@nestjs/swagger';

import { RefundStatus } from '@/shared/enum/refund-status.enum';

export class RefundStatusHistoryDto {
  @ApiProperty({
    description: '히스토리 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '이전 상태',
    enum: RefundStatus,
    example: RefundStatus.REQUESTED,
  })
  previousStatus: RefundStatus;

  @ApiProperty({
    description: '새로운 상태',
    enum: RefundStatus,
    example: RefundStatus.PROCESSING,
  })
  newStatus: RefundStatus;

  @ApiProperty({
    description: '상태 변경자 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  changedById: string;

  @ApiProperty({
    description: '상태 변경자 이름',
    example: '판매자1',
  })
  changedByName: string;

  @ApiProperty({
    description: '메모',
    example: '배송 업체에서 수거 진행 중입니다.',
    required: false,
  })
  memo?: string;

  @ApiProperty({
    description: '상태 변경 일시',
    example: '2023-07-01T14:00:00.000Z',
  })
  createdAt: Date;
}
