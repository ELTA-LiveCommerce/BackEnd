import { Exclude, Expose, Transform } from 'class-transformer';

import { Delivery, DeliveryStatus } from '../entity/delivery.entity';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { Order } from '@/module/order/entity/order.entity';

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
  buyerId: string;

  @Expose()
  status: DeliveryStatus;

  @Expose()
  trackingNumber?: string;

  @Expose()
  courierCompany?: string;

  @Expose()
  recipientName: string;

  @Expose()
  recipientPhoneNumber: string;

  @Expose()
  shippingAddress: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  shippedAt?: Date;

  @Expose()
  deliveredAt?: Date;

  @Expose()
  canceledAt?: Date;

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

    // OrderItem에서 상품 정보 가져오기 (단순화를 위해 첫 번째 항목 가정)
    // delivery.order가 로드되었다고 가정
    const orderItem = delivery.order?.items?.[0];

    dto.productId = orderItem?.product?.id || '';
    dto.productName = orderItem?.product?.name || '이름 없음';
    dto.productImage = orderItem?.product?.mainImage || ''; // mainImage 사용 또는 적절한 이미지 필드
    dto.quantity = orderItem?.quantity || 0;

    dto.sellerId = delivery.seller?.id || '';
    dto.buyerId = delivery.order?.user?.id || '';
    dto.status = delivery.status;
    dto.trackingNumber = delivery.trackingNumber;
    dto.courierCompany = delivery.courierCompany;
    dto.recipientName = delivery.recipientName;
    dto.recipientPhoneNumber = delivery.recipientPhoneNumber;
    dto.shippingAddress = delivery.address;
    dto.createdAt = delivery.createdAt;
    dto.updatedAt = delivery.updatedAt;
    dto.shippedAt = delivery.shippedAt;
    dto.deliveredAt = delivery.deliveredAt;
    dto.canceledAt = delivery.canceledAt;
    return dto;
  }

  /**
   * 엔티티 배열에서 DTO 배열로 변환
   */
  static fromEntities(deliveries: Delivery[]): DeliveryResponseDto[] {
    return deliveries.map((delivery) => this.fromEntity(delivery));
  }
}

export class SellerDeliveryListItemDto {
  @Expose()
  id: string;

  @Expose()
  productMainImage: string;

  @Expose()
  productName: string;

  @Expose()
  quantity: number;

  @Expose()
  productId: string;

  @Expose()
  trackingNumber: string;

  @Expose()
  buyerLoginId: string;

  @Expose()
  recipientName: string;

  @Expose()
  recipientPhoneNumber: string;

  @Expose()
  address: string;

  @Expose()
  deliveryStatus: DeliveryStatus;

  @Expose()
  orderId: string;

  @Expose()
  orderItemId: string;

  @Expose()
  deliveryId: string;

  static fromEntities(delivery: Delivery, orderItem: OrderItem, order: Order): SellerDeliveryListItemDto {
    const dto = new SellerDeliveryListItemDto();

    const product = orderItem?.product;
    dto.productMainImage = product?.mainImage ?? '';
    dto.productName = product?.name ?? '이름 없음';
    dto.quantity = orderItem?.quantity ?? 0;
    dto.productId = product?.id ?? '';

    dto.trackingNumber = delivery.trackingNumber ?? '';
    dto.buyerLoginId = delivery.order?.user?.loginId ?? '아이디 없음';
    dto.recipientName = delivery.recipientName;
    dto.recipientPhoneNumber = delivery.recipientPhoneNumber;
    dto.address = delivery.address;
    dto.deliveryStatus = delivery.status;
    dto.orderId = delivery.order?.id ?? '';
    dto.orderItemId = orderItem?.id ?? '';
    dto.deliveryId = delivery.id;

    return dto;
  }
}

