export enum OrderStatus {
  PENDING = 'PENDING', // 결제 대기 중
  PAID = 'PAID', // 결제 완료
  PROCESSING = 'PROCESSING', // 주문 처리 중
  SHIPPED = 'SHIPPED', // 배송 중
  DELIVERED = 'DELIVERED', // 배송 완료
  CANCELLED = 'CANCELLED', // 주문 취소
  REFUNDED = 'REFUNDED', // 환불 완료
}
