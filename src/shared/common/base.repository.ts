import { EntityRepository, RequiredEntityData } from '@mikro-orm/postgresql';

export class BaseRepository<T extends object> extends EntityRepository<T> {
  public persist(data: RequiredEntityData<T, never, false>, em = this.em): T {
    const entity = this.create(data);
    em.persist(entity);
    return entity;
  }

  public async persistAndFlush(data: RequiredEntityData<T, never, false>, em = this.em): Promise<T> {
    const entity = this.persist(data, em);
    await em.flush();
    return entity;
  }

  public async flush(em = this.em): Promise<void> {
    await em.flush();
  }

  public remove(entities: T | T[], em = this.em): void {
    if (Array.isArray(entities)) {
      entities.forEach((entity) => em.remove(entity));
    } else {
      em.remove(entities);
    }
  }

  public async removeAndFlush(entities: T | T[], em = this.em): Promise<void> {
    this.remove(entities, em);
    await em.flush();
  }
}
