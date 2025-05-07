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
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  user: User;

  @Enum(() => LoginProvider)
  provider: LoginProvider;

  @Property({ unique: true })
  providerId: string;

  @Property({ nullable: true })
  accessToken?: string;

  @Property({ nullable: true })
  refreshToken?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  nickname?: string;

  @Property({ nullable: true })
  profileImage?: string;

  @Property()
  lastLoginAt: Date = new Date();
}
