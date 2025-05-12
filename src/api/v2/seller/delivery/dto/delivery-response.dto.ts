import { ApiProperty } from '@nestjs/swagger';

import { Order } from '@/module/order/entity/order.entity';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { Delivery, DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';

export class SellerDeliveryListItemDto {
  @ApiProperty({ description: '주문 ID' })
  orderId: string;

  @ApiProperty({ description: '배송 ID' })
  deliveryId: string;

  @ApiProperty({ description: '주문 일시' })
  orderDate: Date;

  @ApiProperty({ description: '배송 상태', enum: DeliveryStatus })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({ description: '상품명' })
  productName: string;

  @ApiProperty({ description: '수량' })
  quantity: number;

  @ApiProperty({ description: '수취인 명' })
  recipientName: string;

  @ApiProperty({ description: '수취인 연락처' })
  recipientPhone: string;

  @ApiProperty({ description: '배송 주소' })
  address: string;

  @ApiProperty({ description: '결제 완료 일시', type: Date, nullable: true })
  paymentDate: Date | null;

  @ApiProperty({ description: '배송 시작 일시', type: Date, nullable: true })
  deliveryStartDate: Date | null;

  @ApiProperty({ description: '배송 완료 일시', type: Date, nullable: true })
  deliveryCompletedDate: Date | null;

  static fromEntities(
    deliveriesWithDetails: { delivery: Delivery; order: Order; orderItem: OrderItem | null }[],
  ): SellerDeliveryListItemDto[] {
    return deliveriesWithDetails.map(({ delivery, order, orderItem }) => {
      const dto = new SellerDeliveryListItemDto();
      dto.orderId = order.id;
      dto.deliveryId = delivery.id;
      dto.orderDate = order.createdAt;
      dto.deliveryStatus = delivery.status;
      dto.productName = orderItem?.product?.name ?? 'N/A';
      dto.quantity = orderItem?.quantity ?? 0;
      dto.recipientName = delivery.recipientName;
      dto.recipientPhone = delivery.recipientPhoneNumber;
      dto.address = delivery.address;
      dto.paymentDate = order.paidAt ?? null;
      dto.deliveryStartDate = delivery.shippedAt ?? null;
      dto.deliveryCompletedDate = delivery.deliveredAt ?? null;
      return dto;
    });
  }
}

export class PagedSellerDeliveryResponseDto extends PagedResponseV2<SellerDeliveryListItemDto> {
  @ApiProperty({ type: [SellerDeliveryListItemDto], description: '판매자 배송 목록' })
  items: SellerDeliveryListItemDto[];
}
