import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

export class AdminDeliveryResponseBody {
  @ApiProperty({ description: '배송 ID', example: 'delivery-123' })
  id!: string;

  @ApiProperty({ description: '주문 ID', example: 'order-123' })
  orderId!: string;

  @ApiProperty({ description: '상품 ID', example: 'product-123' })
  productId!: string;

  @ApiProperty({ description: '상품 이미지 URL', example: 'https://example.com/image.jpg' })
  productImageUrl!: string;

  @ApiProperty({ description: '상품명', example: '스마트폰' })
  productName!: string;

  @ApiProperty({ description: '구매 수량', example: 2 })
  quantity!: number;

  @ApiProperty({ description: '송장 번호', example: '123456789', required: false })
  trackingNumber?: string;

  @ApiProperty({ description: '배송 업체', example: '우체국택배', required: false })
  courierCompany?: string;

  @ApiProperty({ description: '배송 상태', enum: DeliveryStatus, example: DeliveryStatus.SHIPPING })
  status!: DeliveryStatus;

  @ApiProperty({ description: '받는 사람 이름', example: '홍길동' })
  recipientName!: string;

  @ApiProperty({ description: '받는 사람 전화번호', example: '010-1234-5678' })
  recipientPhoneNumber!: string;

  @ApiProperty({ description: '배송 주소', example: '서울시 강남구' })
  address!: string;

  @ApiProperty({ description: '생성 시간', example: '2023-01-01T00:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ description: '발송 시간', example: '2023-01-02T00:00:00Z', required: false })
  shippedAt?: Date;

  @ApiProperty({ description: '배송 완료 시간', example: '2023-01-03T00:00:00Z', required: false })
  deliveredAt?: Date;

  // 배송-주문-상품 데이터를 결합하여 응답 객체를 생성하는 메소드
  static fromEntity(delivery: any, orderItem?: any): AdminDeliveryResponseBody {
    const response = new AdminDeliveryResponseBody();
    response.id = delivery.id;
    response.orderId = delivery.order?.id || '';
    response.status = delivery.status;
    response.trackingNumber = delivery.trackingNumber;
    response.courierCompany = delivery.courierCompany;
    response.recipientName = delivery.recipientName;
    response.recipientPhoneNumber = delivery.recipientPhoneNumber;
    response.address = delivery.address;
    response.createdAt = delivery.createdAt;
    response.shippedAt = delivery.shippedAt;
    response.deliveredAt = delivery.deliveredAt;

    // OrderItem이 제공된 경우 상품 정보 설정
    if (orderItem) {
      response.productId = orderItem.product?.id || '';
      response.productName = orderItem.product?.name || '상품명 없음';
      response.productImageUrl = orderItem.product?.mainImage || '';
      response.quantity = orderItem.quantity || 0;
    }

    return response;
  }
}

export class AdminDeliveryListResponse extends PagedResponseV2<AdminDeliveryResponseBody> {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  declare success: boolean;

  @ApiProperty({
    description: 'HTTP 상태 코드',
    example: 200,
  })
  declare statusCode: number;

  @ApiProperty({
    description: '응답 메시지',
    example: '요청 성공',
  })
  declare message: string;

  @ApiProperty({
    description: '페이지네이션된 배송 목록 데이터',
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/AdminDeliveryResponseBody' },
      },
      total: { type: 'number', description: '전체 항목 수' },
      page: { type: 'number', description: '현재 페이지 번호' },
      limit: { type: 'number', description: '페이지당 항목 수' },
      totalPages: { type: 'number', description: '전체 페이지 수' },
    },
  })
  declare data: {
    items: AdminDeliveryResponseBody[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({
    description: '응답 타임스탬프',
    example: '2024-05-12T14:30:00Z',
  })
  declare timestamp: string;

  static fromResult(
    items: { delivery: any; orderItems: any[] }[],
    total: number,
    page: number,
    limit: number,
  ): AdminDeliveryListResponse {
    const responseItems = items.flatMap(({ delivery, orderItems }) => {
      // 주문 아이템이 없는 경우 배송 정보만 반환
      if (!orderItems || orderItems.length === 0) {
        return [AdminDeliveryResponseBody.fromEntity(delivery)];
      }

      // 각 주문 아이템에 대한 배송 정보 생성
      return orderItems.map((item) => AdminDeliveryResponseBody.fromEntity(delivery, item));
    });

    return new AdminDeliveryListResponse(responseItems, total, page, limit);
  }
}

export class AdminDeliveryResponse extends BaseResponseV2<AdminDeliveryResponseBody> {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  declare success: boolean;

  @ApiProperty({
    description: 'HTTP 상태 코드',
    example: 200,
  })
  declare statusCode: number;

  @ApiProperty({
    description: '응답 메시지',
    example: '요청 성공',
  })
  declare message: string;

  @ApiProperty({
    description: '배송 상세 정보',
    type: AdminDeliveryResponseBody,
  })
  declare data: AdminDeliveryResponseBody;

  @ApiProperty({
    description: '응답 타임스탬프',
    example: '2024-05-12T14:30:00Z',
  })
  declare timestamp: string;

  static fromEntity(delivery: any, orderItem?: any): AdminDeliveryResponse {
    const body = AdminDeliveryResponseBody.fromEntity(delivery, orderItem);
    return BaseResponseV2.success(body);
  }
}

