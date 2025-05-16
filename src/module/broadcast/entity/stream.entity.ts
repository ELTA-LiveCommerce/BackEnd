import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, ManyToMany } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { User } from '@/module/user/entity/user.entity';
@Entity()
export class Stream {
  @PrimaryKey()
  id!: string;

  @ManyToOne(() => User)
  seller: User;

  @Property({ onCreate: () => new Date() })
  startedAt: Date;

  @Property({ nullable: true })
  endedAt?: Date;

  // @Property({
  //   type: 'json',
  //   nullable: true,
  //   defaultRaw: "'{}'::jsonb",   // ← Postgres 에 유효 JSON 기본값 생성
  // })
  // metadata?: Record<string, any>;
}