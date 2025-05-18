import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { BaseEntity } from '@/shared/entity/base.entity';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';

@Entity({ tableName: 'purchase_logs' })
export class PurchaseLog extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @ManyToOne(() => User)
  buyer: User;

  @ManyToOne(() => Product)
  product: Product;

  @Property({ type: 'number' })
  price: number;

  @Property({ type: 'number' })
  quantity: number;

  @Property()
  purchasedAt: Date = new Date();

  constructor(buyer: User, product: Product, price: number, quantity: number) {
    super();
    this.buyer = buyer;
    this.product = product;
    this.price = price;
    this.quantity = quantity;
  }
}
