import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

@Entity({ tableName: 'shipping_addresses' })
export class ShippingAddress extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @ManyToOne(() => User)
  user: User;

  @Property({ length: 100, type: 'string' })
  address: string;

  @Property({ length: 100, nullable: true, type: 'string' })
  detailAddress?: string;

  @Property({ length: 20, nullable: true, type: 'string' })
  zipCode?: string;

  @Property({ length: 50, nullable: true, type: 'string' })
  receiver?: string;

  @Property({ length: 20, nullable: true, type: 'string' })
  receiverPhone?: string;

  @Property({ default: false, type: 'boolean' })
  isDefault: boolean = false;
}
