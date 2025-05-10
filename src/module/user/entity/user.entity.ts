import { Collection, Entity, Enum, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Login } from '@/module/auth/entity/login.entity';
import { UserStatus } from '@/module/user/dto/update-user-status.dto';
import { Follow } from '@/module/user/entity/follow.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ unique: true, type: 'string' })
  email: string;

  @Property({ type: 'string' })
  password: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ nullable: true, type: 'string' })
  phoneNumber?: string;

  @Property({ nullable: true, type: 'string' })
  profileImage?: string;

  @Property({ nullable: true, type: 'string' })
  accountNumber?: string;

  @Property({ nullable: true, type: 'string' })
  bankName?: string;

  @Enum({ items: () => UserRole, default: UserRole.VIEWER, type: 'string' })
  role: UserRole;

  @Property({ default: false, type: 'boolean' })
  isVerified: boolean = false;

  @Enum({ items: () => UserStatus, default: UserStatus.ACTIVE, type: 'string' })
  status: UserStatus = UserStatus.ACTIVE;

  @Property({ nullable: true, type: 'string' })
  blockReason?: string;

  @Property({ nullable: true, type: 'string' })
  address?: string;

  @Property({ nullable: true, type: 'string' })
  gender?: string;

  @Property({ nullable: true, type: 'Date' })
  deletedAt?: Date;

  @OneToMany(() => Login, (login) => login.user)
  logins = new Collection<Login>(this);

  @OneToMany(() => Follow, (follow) => follow.follower)
  following = new Collection<Follow>(this);

  @OneToMany(() => Follow, (follow) => follow.following)
  followers = new Collection<Follow>(this);
}
