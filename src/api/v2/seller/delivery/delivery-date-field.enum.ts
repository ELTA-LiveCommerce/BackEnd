export enum SellerDeliveryDateField {
  ORDER_DATE = 'orderCreatedAt', // 주문 생성일 (Order.createdAt)
  PAYMENT_DATE = 'orderPaidAt', // 주문 결제일 (Order.paidAt, 가정)
  DELIVERY_START_DATE = 'deliveryShippedAt', // 배송 시작일 (Delivery.shippedAt)
  DELIVERY_COMPLETED_DATE = 'deliveryDeliveredAt', // 배송 완료일 (Delivery.deliveredAt)
  // 필요시 배송 시작일 등 추가
}
