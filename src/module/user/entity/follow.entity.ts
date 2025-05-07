import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

@Entity({ tableName: 'follows' })
@Unique({ properties: ['follower', 'following'] })
export class Follow extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  follower: User;

  @ManyToOne(() => User)
  following: User;

  @Property({ default: false })
  isNotified: boolean = false;
}
