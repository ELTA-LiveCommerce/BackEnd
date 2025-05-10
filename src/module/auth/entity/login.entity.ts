import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

export enum LoginProvider {
  EMAIL = 'email',
  KAKAO = 'kakao',
  APPLE = 'apple',
}

@Entity({ tableName: 'logins' })
export class Login extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @ManyToOne(() => User)
  user: User;

  @Enum({ items: () => LoginProvider, type: 'string' })
  provider: LoginProvider;

  @Property({ type: 'string', unique: true })
  providerId: string;

  @Property({ type: 'string', nullable: true })
  accessToken?: string;

  @Property({ type: 'string', nullable: true })
  refreshToken?: string;

  @Property({ type: 'string', nullable: true })
  email?: string;

  @Property({ type: 'string', nullable: true })
  nickname?: string;

  @Property({ type: 'string', nullable: true })
  profileImage?: string;

  @Property({ type: 'Date' })
  lastLoginAt: Date = new Date();
}
