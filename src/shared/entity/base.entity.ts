import { Property } from '@mikro-orm/postgresql';

export abstract class BaseEntity {
  @Property({ defaultRaw: 'NOW()' })
  createdAt: Date = new Date();

  @Property({ defaultRaw: 'NOW()', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
