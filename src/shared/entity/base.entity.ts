import { Property } from '@mikro-orm/core';

export abstract class BaseEntity {
  @Property({ type: 'Date', defaultRaw: 'NOW()' })
  createdAt: Date = new Date();

  @Property({ type: 'Date', defaultRaw: 'NOW()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
