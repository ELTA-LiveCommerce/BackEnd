import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { BaseEntity } from '@/shared/entity/base.entity';

import { User } from './user.entity';

@Entity({ tableName: 'shipping_addresses' })
export class ShippingAddress extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  user: User;

  @Property({ length: 100 })
  address: string;

  @Property({ length: 100, nullable: true })
  detailAddress?: string;

  @Property({ length: 20, nullable: true })
  zipCode?: string;

  @Property({ length: 50, nullable: true })
  receiver?: string;

  @Property({ length: 20, nullable: true })
  receiverPhone?: string;

  @Property({ default: false })
  isDefault: boolean = false;
}
