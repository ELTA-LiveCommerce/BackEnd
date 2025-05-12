import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

export abstract class BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ type: 'Date', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();

  @Property({ type: 'Date', defaultRaw: 'NOW()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
