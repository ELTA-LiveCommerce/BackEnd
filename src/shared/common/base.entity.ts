import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

export abstract class BaseEntity {
  @Property({ autoincrement: true, unsigned: true })
  readonly id!: number;

  @PrimaryKey()
  readonly uuid: string = v4();

  @Property({ defaultRaw: 'now()' })
  createdAt: Date = new Date();

  /** @deprecated */
  @Property({ defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
