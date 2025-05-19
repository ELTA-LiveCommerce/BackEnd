import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { BaseResponseV2, PagedResponseV2, PagedResponseData } from '@/api/v2/common/base-response.dto';

export class OrderItemResponseBody {
  @ApiProperty({ description: '주문 상품 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  id: string;

  @ApiProperty({ description: '상품 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  productId: string;

  @ApiProperty({ description: '상품명', example: '프리미엄 티셔츠' })
  productName: string;

  @ApiProperty({ description: '상품 이미지 URL', example: 'https://example.com/images/product123.jpg' })
  productImage?: string;

  @ApiProperty({ description: '주문 수량', example: 2 })
  quantity: number;

  @ApiProperty({ description: '상품 단가', example: 25000 })
  price: number;

  @ApiProperty({ description: '총 금액', example: 50000 })
  totalPrice: number;

  @ApiProperty({ description: '상품 옵션 (JSON string)', example: '{"color": "Red", "size": "M"}' })
  attributes?: string;
}

export class OrderResponseBody {
  @ApiProperty({ description: '주문 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  id: string;

  @ApiProperty({ description: '주문 번호', example: 'ORD20240601123456' })
  orderNumber: string;

  @ApiProperty({ description: '회원 ID', example: 'u7v8w9x0-y1z2-a3b4-c5d6-e7f8g9h0i1j2' })
  userId: string;

  @ApiProperty({ enum: OrderStatus, description: '주문 상태', example: OrderStatus.PAID })
  status: OrderStatus;

  @ApiProperty({ type: [OrderItemResponseBody], description: '주문 상품 목록' })
  items: OrderItemResponseBody[];

  @ApiProperty({ description: '총 주문 금액', example: 50000 })
  totalAmount: number;

  @ApiProperty({ description: '결제 방법', example: '신용카드' })
  paymentMethod?: string;

  @ApiProperty({ description: '결제 ID', example: 'PAY12345678' })
  paymentId?: string;

  @ApiProperty({ description: '배송지 주소', example: '서울시 강남구 역삼동 123-456' })
  shippingAddress?: string;

  @ApiProperty({ description: '운송장 번호', example: '1234567890' })
  shippingCode?: string;

  @ApiProperty({ description: '주문 메모', example: '부재시 경비실에 맡겨주세요' })
  notes?: string;

  @ApiProperty({ description: '주문 생성일', example: '2024-06-01T12:34:56Z' })
  createdAt: Date;

  @ApiProperty({ description: '주문 수정일', example: '2024-06-01T12:34:56Z' })
  updatedAt: Date;

  @ApiProperty({ description: '결제 완료일', example: '2024-06-01T12:34:56Z' })
  paidAt?: Date;

  @ApiProperty({ description: '배송 시작일', example: '2024-06-02T09:00:00Z' })
  shippedAt?: Date;

  @ApiProperty({ description: '배송 완료일', example: '2024-06-03T15:30:00Z' })
  deliveredAt?: Date;

  @ApiProperty({ description: '주문 취소일', example: '2024-06-01T14:30:00Z' })
  cancelledAt?: Date;

  @ApiProperty({ description: '환불 처리일', example: '2024-06-02T10:15:00Z' })
  refundedAt?: Date;
}

export class OrderSummaryResponseBody {
  @ApiProperty({ description: '주문 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  id: string;

  @ApiProperty({ description: '주문 번호', example: 'ORD20240601123456' })
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus, description: '주문 상태', example: OrderStatus.PAID })
  status: OrderStatus;

  @ApiProperty({ description: '총 주문 금액', example: 50000 })
  totalAmount: number;

  @ApiProperty({ description: '주문 상품 개수', example: 2 })
  itemCount: number;

  @ApiProperty({ description: '주문 생성일', example: '2024-06-01T12:34:56Z' })
  createdAt: Date;

  @ApiProperty({ description: '주문 수정일', example: '2024-06-01T12:34:56Z' })
  updatedAt: Date;
}

export class OrderResponse extends BaseResponseV2<OrderResponseBody> {
  static fromOrderResponseDto(orderResponseDto: OrderResponseBody): OrderResponse {
    return BaseResponseV2.success(orderResponseDto, '주문 정보를 성공적으로 조회했습니다.');
  }
}

export class OrderListResponse extends PagedResponseV2<OrderSummaryResponseBody> {
  static fromPaginatedOrdersResponseDto(
    paginatedOrdersResponseDto: PagedResponseData<OrderSummaryResponseBody>,
  ): OrderListResponse {
    return new PagedResponseV2(
      paginatedOrdersResponseDto.items,
      paginatedOrdersResponseDto.total,
      paginatedOrdersResponseDto.page,
      paginatedOrdersResponseDto.limit,
      '주문 목록을 성공적으로 조회했습니다.',
    );
  }
}
