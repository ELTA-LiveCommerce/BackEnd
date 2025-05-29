import { Collection, Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { OrderItem } from '@/module/order/entity/order-item.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';

@Entity({ tableName: 'orders' })
export class Order extends BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => User)
  user: User;

  @Property({ type: 'string' })
  orderNumber: string;

  @Enum({ items: () => OrderStatus, type: 'string' })
  status: OrderStatus = OrderStatus.PENDING;

  @OneToMany(() => OrderItem, (item) => item.order, { eager: true, orphanRemoval: true })
  items = new Collection<OrderItem>(this);

  @Property({ type: 'number' })
  totalAmount: number;

  @Property({ type: 'string', nullable: true })
  paymentMethod?: string;

  @Property({ type: 'string', nullable: true })
  paymentId?: string;

  @Property({ type: 'string', nullable: true })
  shippingAddress?: string;

  @Property({ type: 'string', nullable: true })
  shippingCode?: string;

  @Property({ type: 'string', nullable: true })
  cancelReason?: string;

  @Property({ type: 'string', nullable: true })
  refundReason?: string;

  @Property({ type: 'string', nullable: true })
  notes?: string;

  @Property({ type: 'Date', nullable: true })
  paidAt?: Date;

  @Property({ type: 'Date', nullable: true })
  shippedAt?: Date;

  @Property({ type: 'Date', nullable: true })
  deliveredAt?: Date;

  @Property({ type: 'Date', nullable: true })
  cancelledAt?: Date;

  @Property({ type: 'Date', nullable: true })
  refundedAt?: Date;

  constructor(user: User, paymentMethod?: string, shippingAddress?: string, notes?: string) {
    super();
    this.user = user;
    this.orderNumber = v4().substring(0, 8); // 간단한 주문번호 생성 예시
    this.status = OrderStatus.PENDING;
    this.totalAmount = 0; // 초기 총액은 0
    if (paymentMethod) this.paymentMethod = paymentMethod;
    if (shippingAddress) this.shippingAddress = shippingAddress;
    if (notes) this.notes = notes;
    // items는 OrderItem 추가 시 관리
  }
}

