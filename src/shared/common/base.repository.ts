import { EntityRepository, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EntityData } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/knex';

export class BaseRepository<T extends object> extends EntityRepository<T> {
  protected _persist(
    entity: T,
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): SqlEntityManager<PostgreSqlDriver> {
    em.persist(entity);
    return em;
  }

  public createAndPersist(
    data: EntityData<T>,
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): T {
    const entityToPersist = this.create(data as any);
    this._persist(entityToPersist, em);
    return entityToPersist;
  }

  public async persistAndFlush(
    entity: T,
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): Promise<void> {
    this._persist(entity, em);
    await em.flush();
  }

  public async createPersistAndFlush(
    data: EntityData<T>,
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): Promise<T> {
    const entity = this.createAndPersist(data, em);
    await em.flush();
    return entity;
  }

  public async flush(
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): Promise<void> {
    await em.flush();
  }

  protected _remove(
    entity: T,
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): SqlEntityManager<PostgreSqlDriver> {
    em.remove(entity as any);
    return em;
  }

  public removeMany(
    entities: T[],
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): void {
    entities.forEach((entity) => this._remove(entity, em));
  }

  public async removeAndFlush(
    entity: T,
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): Promise<void> {
    this._remove(entity, em);
    await em.flush();
  }

  public async removeManyAndFlush(
    entities: T[],
    em: SqlEntityManager<PostgreSqlDriver> = this.em as SqlEntityManager<PostgreSqlDriver>,
  ): Promise<void> {
    this.removeMany(entities, em);
    await em.flush();
  }
}
