import { Exclude, Expose, Transform } from 'class-transformer';

import { Payment, PaymentStatus } from '../entity/payment.entity';

/**
 * 입금 상태 한글 표현
 */
export const PaymentStatusKorean = {
  [PaymentStatus.PENDING]: '입금대기',
  [PaymentStatus.COMPLETED]: '입금완료',
  [PaymentStatus.CANCELED]: '취소됨',
  [PaymentStatus.REFUNDED]: '환불됨',
};

export class PaymentResponseDto {
  @Expose()
  id: string;

  @Expose()
  orderId: string;

  // 상품 정보
  @Expose()
  productImage: string = '';

  @Expose()
  productName: string = '';

  @Expose()
  quantity: number = 1;

  // 판매자 정보
  @Expose()
  sellerId: string = '';

  @Expose()
  sellerName: string = '';

  // 구매자 정보
  @Expose()
  buyerId: string = '';

  @Expose()
  buyerName: string = '';

  @Expose()
  buyerPhone: string = '';

  @Expose()
  shippingAddress: string = '';

  // 입금 정보
  @Expose()
  amount: number;

  @Expose()
  status: PaymentStatus;

  @Expose()
  @Transform(({ value }) => PaymentStatusKorean[value] || value)
  statusText: string;

  @Expose()
  bankName: string = '';

  @Expose()
  accountNumber: string = '';

  @Expose()
  accountHolder: string = '';

  @Expose()
  paymentMethod: string = '';

  @Expose()
  transactionId: string = '';

  @Expose()
  notes: string = '';

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  completedAt: Date | null = null;

  @Expose()
  canceledAt: Date | null = null;

  @Expose()
  refundedAt: Date | null = null;

  @Exclude()
  order: any;

  @Exclude()
  seller: any;

  /**
   * 엔티티에서 DTO로 변환
   */
  static fromEntity(payment: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = payment.id;
    dto.orderId = payment.order?.id || '';

    // 주문 아이템 정보 (첫번째 상품만 표시)
    const firstItem = payment.order?.items?.[0];
    if (firstItem) {
      dto.productImage = firstItem.product?.images?.[0] || '';
      dto.productName = firstItem.product?.name || '';
      dto.quantity = firstItem.quantity || 1;
    }

    // 판매자 정보
    dto.sellerId = payment.seller?.id || '';
    dto.sellerName = payment.seller?.name || '';

    // 구매자 정보
    dto.buyerId = payment.order?.user?.id || '';
    dto.buyerName = payment.order?.user?.name || '';
    dto.buyerPhone = payment.order?.user?.phoneNumber || '';
    dto.shippingAddress = payment.order?.shippingAddress || '';

    // 입금 정보
    dto.amount = payment.amount;
    dto.status = payment.status;
    dto.statusText = PaymentStatusKorean[payment.status] || payment.status;
    dto.paymentMethod = payment.paymentMethod || '';
    dto.transactionId = payment.transactionId || '';
    dto.notes = payment.notes || '';

    // 은행 정보 (예시, 실제로는 판매자 계좌 정보 또는 시스템 설정에서 가져와야 함)
    dto.bankName = payment.seller?.bankName || '';
    dto.accountNumber = payment.seller?.accountNumber || '';
    dto.accountHolder = payment.seller?.name || '';

    // 시간 정보
    dto.createdAt = payment.createdAt;
    dto.updatedAt = payment.updatedAt;
    dto.completedAt = payment.completedAt || null;
    dto.canceledAt = payment.canceledAt || null;
    dto.refundedAt = payment.refundedAt || null;

    return dto;
  }

  /**
   * 엔티티 배열에서 DTO 배열로 변환
   */
  static fromEntities(payments: Payment[]): PaymentResponseDto[] {
    return payments.map((payment) => this.fromEntity(payment));
  }
}
