import { Collection, Entity, Enum, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { Login } from '@/module/auth/entity/login.entity';
import { Follow } from '@/module/user/entity/follow.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @Property({ unique: true })
  email: string;

  @Property()
  password: string;

  @Property()
  name: string;

  @Property({ nullable: true })
  phoneNumber?: string;

  @Property({ nullable: true })
  profileImage?: string;

  @Property({ nullable: true })
  accountNumber?: string;

  @Property({ nullable: true })
  bankName?: string;

  @Enum({ items: () => UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Property({ default: false })
  isVerified: boolean = false;

  @OneToMany(() => Login, (login) => login.user)
  logins = new Collection<Login>(this);

  @OneToMany(() => Follow, (follow) => follow.follower)
  following = new Collection<Follow>(this);

  @OneToMany(() => Follow, (follow) => follow.following)
  followers = new Collection<Follow>(this);
}
