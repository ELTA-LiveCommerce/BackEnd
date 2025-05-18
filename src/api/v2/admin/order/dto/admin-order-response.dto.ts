import { ApiProperty } from '@nestjs/swagger';
import { Order } from '@/module/order/entity/order.entity';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { Type } from 'class-transformer';

export class AdminOrderItemResponseBody {
  @ApiProperty({ description: '주문 상품 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  id: string;

  @ApiProperty({ description: '상품 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  productId: string;

  @ApiProperty({ description: '상품명', example: '멋진 상품' })
  productName: string;

  @ApiProperty({ description: '상품 가격', example: 10000 })
  price: number;

  @ApiProperty({ description: '주문 수량', example: 2 })
  quantity: number;

  @ApiProperty({ description: '상품 옵션 (JSON string)', example: '{"color": "Red", "size": "M"}', required: false })
  attributes?: string;

  static fromEntity(entity: OrderItem): AdminOrderItemResponseBody {
    const response = new AdminOrderItemResponseBody();
    response.id = entity.id;
    response.productId = entity.productId;
    response.productName = entity.productName;
    response.price = entity.price;
    response.quantity = entity.quantity;
    response.attributes = entity.attributes;
    return response;
  }
}

export class AdminOrderResponseBody {
  @ApiProperty({ description: '주문 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  id: string;

  @ApiProperty({ description: '사용자 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  userId: string;

  @ApiProperty({ enum: OrderStatus, description: '주문 상태', example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ description: '총 금액', example: 50000 })
  totalAmount: number;

  @ApiProperty({ description: '배송지 주소', example: '서울시 강남구 역삼동 123-456', required: false })
  shippingAddress?: string;

  @ApiProperty({ description: '운송장 번호', example: '1234567890', required: false })
  shippingCode?: string;

  @ApiProperty({ description: '배송 메모', example: '부재시 경비실에 맡겨주세요', required: false })
  shippingMemo?: string;

  @ApiProperty({ description: '주문 메모', example: '선물 포장 부탁드립니다', required: false })
  notes?: string;

  @ApiProperty({ description: '결제 방법', example: '신용카드', required: false })
  paymentMethod?: string;

  @ApiProperty({ description: '결제 상태', example: true })
  isPaid: boolean;

  @ApiProperty({ description: '결제일', example: '2023-01-01T00:00:00.000Z', required: false })
  paidAt?: Date;

  @ApiProperty({ description: '생성일', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: [AdminOrderItemResponseBody], description: '주문 상품 목록' })
  @Type(() => AdminOrderItemResponseBody)
  items: AdminOrderItemResponseBody[];

  static fromEntity(entity: Order): AdminOrderResponseBody {
    const response = new AdminOrderResponseBody();
    response.id = entity.id;
    response.userId = entity.userId;
    response.status = entity.status;
    response.totalAmount = entity.totalAmount;
    response.shippingAddress = entity.shippingAddress;
    response.shippingCode = entity.shippingCode;
    response.shippingMemo = entity.shippingMemo;
    response.notes = entity.notes;
    response.paymentMethod = entity.paymentMethod;
    response.isPaid = entity.isPaid;
    response.paidAt = entity.paidAt;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    response.items = entity.items.map((item) => AdminOrderItemResponseBody.fromEntity(item));
    return response;
  }
}

export class AdminOrderResponse {
  @ApiProperty({ description: '응답 상태', example: true })
  success: boolean;

  @ApiProperty({ type: AdminOrderResponseBody })
  data: AdminOrderResponseBody;

  static fromEntity(entity: Order): AdminOrderResponse {
    return {
      success: true,
      data: AdminOrderResponseBody.fromEntity(entity),
    };
  }
}

export class AdminOrderListResponseBody {
  @ApiProperty({ type: [AdminOrderResponseBody] })
  items: AdminOrderResponseBody[];

  @ApiProperty({ description: '총 아이템 수', example: 100 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '총 페이지 수', example: 10 })
  pages: number;

  constructor(items: AdminOrderResponseBody[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.pages = Math.ceil(total / limit);
  }
}

export class AdminOrderListResponse {
  @ApiProperty({ description: '응답 상태', example: true })
  success: boolean;

  @ApiProperty({ type: AdminOrderListResponseBody })
  data: AdminOrderListResponseBody;

  static fromResult(orders: Order[], total: number, page: number, limit: number): AdminOrderListResponse {
    const items = orders.map((order) => AdminOrderResponseBody.fromEntity(order));
    return {
      success: true,
      data: new AdminOrderListResponseBody(items, total, page, limit),
    };
  }
}
