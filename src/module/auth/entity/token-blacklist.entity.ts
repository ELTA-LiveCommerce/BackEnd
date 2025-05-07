import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BaseEntity } from '@/shared/entity/base.entity';

/**
 * 로그아웃된 토큰을 관리하는 블랙리스트 엔티티
 */
@Entity({ tableName: 'token_blacklist' })
export class TokenBlacklist extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @Property({ unique: true })
  token: string;

  @Property()
  userId: string;

  @Property()
  expiresAt: Date;
}
