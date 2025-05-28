import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ManyToMany } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Broadcast } from './broadcast.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { User } from '@/module/user/entity/user.entity';

@Entity({ tableName: 'streams' })
export class Stream {
  @PrimaryKey()
  id!: string;

  @ManyToOne(() => User)
  seller: User;

  @OneToOne(() => Broadcast, (broadcast) => broadcast.stream, { owner: true })
  broadcast: Broadcast;

  @Property({ type: 'string', nullable: true })
  chatRoomId?: string;

  @Property({ onCreate: () => new Date() })
  startedAt: Date;

  @Property({ nullable: true })
  endedAt?: Date;

  @Property({ type: 'string', nullable: true })
  announcement?: string;

  @ManyToOne(() => BroadcastProduct, { nullable: true })
  currentSellingProduct?: BroadcastProduct;

  // @Property({
  //   type: 'json',
  //   nullable: true,
  //   defaultRaw: "'{}'::jsonb",   // ← Postgres 에 유효 JSON 기본값 생성
  // })
  // metadata?: Record<string, any>;
}

