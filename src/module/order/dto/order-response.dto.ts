import { OrderStatus } from '@/shared/enum/order-status.enum';

export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  attributes?: string;
  productImage?: string;
}

export class OrderResponseDto {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItemResponseDto[];
  totalAmount: number;
  paymentMethod?: string;
  paymentId?: string;
  shippingAddress?: string;
  shippingCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
}

export class OrderSummaryDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedOrdersResponseDto {
  items: OrderSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
