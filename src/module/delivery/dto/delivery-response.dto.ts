import { Exclude, Expose, Transform } from 'class-transformer';

import { Delivery, DeliveryStatus } from '../entity/delivery.entity';

/**
 * 배송 상태 한글 표현
 */
export const DeliveryStatusKorean = {
  [DeliveryStatus.PREPARING]: '배송준비중',
  [DeliveryStatus.SHIPPING]: '배송중',
  [DeliveryStatus.DELIVERED]: '배송완료',
  [DeliveryStatus.CANCELED]: '배송취소',
};

export class DeliveryResponseDto {
  @Expose()
  id: string;

  @Expose()
  orderId: string;

  @Expose()
  productId: string;

  @Expose()
  productName: string;

  @Expose()
  productImage: string;

  @Expose()
  quantity: number;

  @Expose()
  sellerId: string;

  @Expose()
  sellerName: string;

  @Expose()
  buyerId: string;

  @Expose()
  buyerName: string;

  @Expose()
  buyerPhone: string;

  @Expose()
  shippingAddress: string = '';

  @Expose()
  status: DeliveryStatus;

  @Expose()
  @Transform(({ value }) => DeliveryStatusKorean[value] || value)
  statusText: string;

  @Expose()
  trackingNumber: string = '';

  @Expose()
  courierCompany: string = '';

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  shippedAt: Date | null = null;

  @Expose()
  deliveredAt: Date | null = null;

  @Expose()
  canceledAt: Date | null = null;

  @Exclude()
  order: any;

  @Exclude()
  product: any;

  @Exclude()
  seller: any;

  /**
   * 엔티티에서 DTO로 변환
   */
  static fromEntity(delivery: Delivery): DeliveryResponseDto {
    const dto = new DeliveryResponseDto();
    dto.id = delivery.id;
    dto.orderId = delivery.order?.id || '';
    dto.productId = delivery.product?.id || '';
    dto.productName = delivery.product?.name || '';
    dto.productImage = delivery.product?.images?.[0] || '';

    // 주문 아이템에서 해당 상품의 수량 찾기
    const orderItem = delivery.order?.items?.getItems().find((item) => item.product?.id === delivery.product?.id);
    dto.quantity = orderItem?.quantity || 1;

    dto.sellerId = delivery.seller?.id || '';
    dto.sellerName = delivery.seller?.name || '';
    dto.buyerId = delivery.order?.user?.id || '';
    dto.buyerName = delivery.order?.user?.name || '';
    dto.buyerPhone = delivery.order?.user?.phoneNumber || '';
    dto.shippingAddress = delivery.shippingAddress || '';
    dto.status = delivery.status;
    dto.statusText = DeliveryStatusKorean[delivery.status] || delivery.status;
    dto.trackingNumber = delivery.trackingNumber || '';
    dto.courierCompany = delivery.courierCompany || '';
    dto.createdAt = delivery.createdAt;
    dto.updatedAt = delivery.updatedAt;
    dto.shippedAt = delivery.shippedAt || null;
    dto.deliveredAt = delivery.deliveredAt || null;
    dto.canceledAt = delivery.canceledAt || null;
    return dto;
  }

  /**
   * 엔티티 배열에서 DTO 배열로 변환
   */
  static fromEntities(deliveries: Delivery[]): DeliveryResponseDto[] {
    return deliveries.map((delivery) => this.fromEntity(delivery));
  }
}
