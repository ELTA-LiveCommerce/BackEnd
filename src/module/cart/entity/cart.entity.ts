import { Entity, ManyToOne, OneToMany, Property, Cascade, Index, Collection } from '@mikro-orm/core';
import { BaseEntity } from '@/shared/entity/base.entity';
import { User } from '@/module/user/entity/user.entity';
import { CartItem } from './cart-item.entity';

@Entity()
@Index({ properties: ['user'] })
export class Cart extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany('CartItem', 'cart', {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  items = new Collection<CartItem>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

