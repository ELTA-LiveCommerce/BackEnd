import { ApiProperty } from '@nestjs/swagger';

export class DepositListItemDto {
  @ApiProperty({ description: '입금 ID (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id: string;

  @ApiProperty({ description: '주문 ID (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  orderId: string;

  @ApiProperty({ description: '주문 번호', example: 'ORD-20231027-001' })
  orderNumber: string;

  @ApiProperty({ description: '금액', example: 50000 })
  amount: number;

  @ApiProperty({ description: '상태', example: 'PENDING' })
  status: string;

  @ApiProperty({ description: '고객명', example: '홍길동' })
  customerName: string;

  @ApiProperty({ description: '상품명', example: '맛있는 사과' })
  productName: string;

  @ApiProperty({ description: '고객 전화번호', example: '010-1234-5678' })
  phoneNumber: string;

  @ApiProperty({ 
    description: '선택한 옵션 목록', 
    example: [
      { option: '사이즈 - L', quantity: 2 },
      { option: '사이즈 - 32', quantity: 1 }
    ], 
    required: false,
    type: 'array',
    isArray: true
  })
  selectedOptions?: any[];

  @ApiProperty({ description: '생성일시', example: '2023-10-27T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: '수정일시', example: '2023-10-27T10:00:00Z' })
  updatedAt: string;
}
