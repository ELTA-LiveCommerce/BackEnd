import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';

import { OrderItem } from '@/module/order/entity/order-item.entity'; // Assuming OrderItem exists
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { RefundStatus } from '@/shared/enum/refund-status.enum';

@Entity({ tableName: 'refunds' })
export class RefundEntity extends BaseEntity {
  // 어떤 주문 항목에 대한 반품인지
  @ManyToOne(() => OrderItem)
  orderItem: OrderItem;

  // 어떤 상품인지 (OrderItem 통해 접근 가능하지만 편의상 추가)
  @ManyToOne(() => Product)
  product: Product;

  // 어떤 판매자의 상품인지
  @ManyToOne(() => User)
  seller: User;

  // 어떤 구매자가 요청했는지
  @ManyToOne(() => User)
  buyer: User;

  @Property({ type: 'number' })
  quantity: number; // 반품 수량

  @Property({ type: 'text' })
  reason: string; // 반품 사유

  @Enum(() => RefundStatus)
  status: RefundStatus = RefundStatus.REQUESTED; // 반품 상태

  // 구매자 환불 정보
  @Property({ nullable: true, type: 'string' })
  buyerBankName?: string;

  @Property({ nullable: true, type: 'string' })
  buyerAccountNumber?: string;

  // 회수지 주소 (단순 문자열로 저장)
  @Property({ type: 'string' })
  returnAddress: string;

  // 관리자 메모 등 추가 필드 가능성
  @Property({ type: 'text', nullable: true })
  adminMemo?: string;

  // 상태 변경 이력 메모
  @Property({ type: 'text', nullable: true })
  statusMemo?: string;

  // 반품 상태 히스토리 (필요한 경우 별도 테이블로 분리 가능)
}

