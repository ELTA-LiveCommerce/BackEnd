import { ApiProperty } from '@nestjs/swagger';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { DeliveryStatus, Delivery } from '@/module/delivery/entity/delivery.entity'; // 수정된 경로 및 Delivery import
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { Order } from '@/module/order/entity/order.entity';

export class SellerDeliveryListItemDto {
  @ApiProperty({ description: '상품 대표 이미지 URL', example: 'https://example.com/main.jpg', required: false })
  productMainImage?: string;

  @ApiProperty({ description: '상품명', example: '멋진 상품' })
  productName: string;

  @ApiProperty({ description: '배송 수량', example: 1 })
  quantity: number;

  @ApiProperty({ description: '송장번호', example: '1234567890', required: false })
  trackingNumber?: string;

  @ApiProperty({ description: '구매자 아이디', example: 'buyer123' })
  buyerLoginId: string;

  @ApiProperty({ description: '구매자 이름 (수령인)', example: '김배송' })
  recipientName: string;

  @ApiProperty({ description: '구매자 전화번호 (수령인)', example: '010-1234-5678' })
  recipientPhoneNumber: string;

  @ApiProperty({ description: '배송 주소', example: '서울시 강남구 테헤란로 123' })
  address: string; // 상세 주소 포함 전체 주소

  @ApiProperty({ description: '배송 상태', enum: DeliveryStatus, example: DeliveryStatus.PREPARING })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({ description: '주문 ID', example: 'order-uuid-123' })
  orderId: string;

  @ApiProperty({ description: '주문 항목 ID', example: 'order-item-uuid-456' })
  orderItemId: string;

  @ApiProperty({ description: '배송 ID', example: 'delivery-uuid-789' })
  deliveryId: string;

  static fromEntities(delivery: Delivery, orderItem: OrderItem, order: Order): SellerDeliveryListItemDto {
    const dto = new SellerDeliveryListItemDto();
    dto.productMainImage = orderItem.product?.mainImage;
    dto.productName = orderItem.product?.name || '상품 정보 없음';
    dto.quantity = orderItem.quantity;

    dto.trackingNumber = delivery.trackingNumber;
    dto.buyerLoginId = order.user?.loginId || '구매자 정보 없음';
    dto.recipientName = delivery.recipientName;
    dto.recipientPhoneNumber = delivery.recipientPhoneNumber;
    dto.address = delivery.address;
    dto.deliveryStatus = delivery.status;

    dto.orderId = order.id;
    dto.orderItemId = orderItem.id;
    dto.deliveryId = delivery.id;
    return dto;
  }
}

export class SellerDeliveryListResponseDto extends PagedResponseV2<SellerDeliveryListItemDto> {
  // PagedResponseV2.create 사용
}
