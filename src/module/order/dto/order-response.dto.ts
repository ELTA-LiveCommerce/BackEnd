import { OrderStatus } from '@/shared/enum/order-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ description: '주문 항목 ID' })
  id: string;
  
  @ApiProperty({ description: '상품 ID' })
  productId: string;
  
  @ApiProperty({ description: '상품명' })
  productName: string;
  
  @ApiProperty({ description: '수량' })
  quantity: number;
  
  @ApiProperty({ description: '단가' })
  price: number;
  
  @ApiProperty({ description: '총 가격' })
  totalPrice: number;
  
  @ApiProperty({ description: '상품 옵션', required: false })
  attributes?: string;
  
  @ApiProperty({ description: '상품 이미지 URL', required: false })
  productImage?: string;
}

export class SelectedOptionDto {
  @ApiProperty({ description: '상품 ID' })
  productId: string;
  
  @ApiProperty({ description: '상품명' })
  productName: string;
  
  @ApiProperty({ description: '선택한 옵션명' })
  option: string;
  
  @ApiProperty({ description: '수량' })
  quantity: number;
}

export class OrderResponseDto {
  @ApiProperty({ description: '주문 ID' })
  id: string;
  
  @ApiProperty({ description: '주문 번호' })
  orderNumber: string;
  
  @ApiProperty({ description: '사용자 ID' })
  userId: string;
  
  @ApiProperty({ enum: OrderStatus, description: '주문 상태' })
  status: OrderStatus;
  
  @ApiProperty({ type: [OrderItemResponseDto], description: '주문 상품 목록' })
  items: OrderItemResponseDto[];
  
  @ApiProperty({ description: '총 주문 금액' })
  totalAmount: number;
  
  @ApiProperty({ description: '결제 방법', required: false })
  paymentMethod?: string;
  
  @ApiProperty({ description: '결제 ID', required: false })
  paymentId?: string;
  
  @ApiProperty({ description: '배송지 주소', required: false })
  shippingAddress?: string;
  
  @ApiProperty({ description: '운송장 번호', required: false })
  shippingCode?: string;
  
  @ApiProperty({ description: '메모', required: false })
  notes?: string;
  
  @ApiProperty({ type: [SelectedOptionDto], description: '선택된 옵션 목록', required: false })
  selectedOptions?: SelectedOptionDto[];
  
  @ApiProperty({ description: '생성일시' })
  createdAt: Date;
  
  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
  
  @ApiProperty({ description: '결제일시', required: false })
  paidAt?: Date;
  
  @ApiProperty({ description: '발송일시', required: false })
  shippedAt?: Date;
  
  @ApiProperty({ description: '배송완료일시', required: false })
  deliveredAt?: Date;
  
  @ApiProperty({ description: '취소일시', required: false })
  cancelledAt?: Date;
  
  @ApiProperty({ description: '환불일시', required: false })
  refundedAt?: Date;
}

export class OrderProductDto {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}


export class OrderSummaryDto {
  @ApiProperty({ description: '주문 ID' })
  id: string;
  
  @ApiProperty({ description: '주문 번호' })
  orderNumber: string;
  
  @ApiProperty({ type: () => OrderProductDto, isArray: true })
  products: OrderProductDto[];
  
  @ApiProperty({ enum: OrderStatus, description: '주문 상태' })
  status: OrderStatus;
  
  @ApiProperty({ description: '총 주문 금액' })
  totalAmount: number;
  
  @ApiProperty({ description: '주문 항목 수' })
  itemCount: number;
  
  @ApiProperty({ type: [SelectedOptionDto], description: '선택된 옵션 목록', required: false })
  selectedOptions?: SelectedOptionDto[];
  
  @ApiProperty({ description: '생성일시' })
  createdAt: Date;
  
  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
  
  @ApiProperty({ description: '배송지 주소', required: false })
  shippingAddress?: string;
}

export class PaginatedOrdersResponseDto {
  items: OrderSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
