import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { BaseEntity } from '@/shared/entity/base.entity';
import { User } from '@/module/user/entity/user.entity';
import { Broadcast } from './broadcast.entity';

@Entity({ tableName: 'view_logs' })
export class ViewLog extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @ManyToOne(() => User)
  viewer: User;

  @ManyToOne(() => Broadcast)
  broadcast: Broadcast;

  @Property()
  viewedAt: Date = new Date();

  constructor(viewer: User, broadcast: Broadcast) {
    super();
    this.viewer = viewer;
    this.broadcast = broadcast;
  }
}
