import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepositListItemDto {
  @ApiProperty({ description: '주문 ID (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  orderId: string; // Changed to string for UUID

  @ApiPropertyOptional({
    description: '상품 대표 이미지 URL',
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  productMainImage?: string | null; // Make optional and nullable

  @ApiProperty({ description: '상품명', example: '맛있는 사과' })
  productName: string;

  @ApiProperty({ description: '상품 수량', example: 2 })
  quantity: number;

  // Allow null for potentially missing user details
  @ApiPropertyOptional({ description: '구매자 은행명', example: '신한은행', nullable: true })
  buyerBankName?: string | null;

  @ApiPropertyOptional({ description: '구매자 계좌번호', example: '110-***-******', nullable: true })
  buyerAccount?: string | null;

  @ApiProperty({ description: '구매자 아이디', example: 'buyer123' })
  buyerLoginId: string;

  @ApiPropertyOptional({ description: '구매자 전화번호', example: '010-1234-5678', nullable: true })
  buyerPhoneNumber?: string | null;

  @ApiPropertyOptional({ description: '구매자 주소', example: '서울시 강남구 테헤란로', nullable: true })
  buyerAddress?: string | null;

  @ApiProperty({ description: '주문 상태', example: 'PAYMENT_COMPLETED' })
  orderStatus: string; // 주문 상태도 함께 반환하는 것이 좋을 수 있습니다.

  @ApiProperty({ description: '주문 생성 시각', example: '2023-10-27T10:00:00Z' })
  createdAt: Date;
}
