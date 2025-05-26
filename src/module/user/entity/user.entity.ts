import {
  Collection,
  Entity,
  Enum,
  OneToMany,
  PrimaryKey,
  Property,
  OneToOne,
  Cascade,
  ManyToMany,
  Unique,
  Filter,
  DecimalType,
} from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Login } from '@/module/auth/entity/login.entity';
import { Follow } from '@/module/user/entity/follow.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { SellerUserBlock } from './seller-user-block.entity';
import { SellerInfo } from './seller-info.entity'; // 주석 해제

@Entity({ tableName: 'users' })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, args: false, default: true })
export class User extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ unique: true, type: 'string' })
  loginId: string;

  @Property({ type: 'string' })
  password: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ nullable: true, type: 'string' })
  phoneNumber?: string;

  @Property({ nullable: true, type: 'string' })
  profileImage?: string;

  @Property({ nullable: true, type: 'string' })
  bannerImage?: string;

  @Property({ nullable: true, type: 'string' })
  accountNumber?: string;

  @Property({ nullable: true, type: 'string' })
  bankName?: string;

  @Property({ nullable: true, type: 'string' })
  bankAccount?: string;

  @Property({ nullable: true, type: DecimalType, precision: 5, scale: 2, default: 0.1 })
  feePercentage?: number = 0.1; // 기본 수수료 10%

  @Enum({ items: () => UserRole, default: UserRole.VIEWER, type: 'string' })
  role: UserRole;

  @Property({ default: false, type: 'boolean' })
  isVerified: boolean = false;

  @Property({ nullable: true, type: 'string' })
  address?: string;

  @Property({ nullable: true, type: 'Date' })
  deletedAt?: Date;

  @OneToMany(() => Login, (login) => login.user)
  logins = new Collection<Login>(this);

  @OneToMany(() => Follow, (follow) => follow.follower)
  following = new Collection<Follow>(this);

  @OneToMany(() => Follow, (follow) => follow.following)
  followers = new Collection<Follow>(this);

  @OneToOne(() => SellerInfo, (sellerInfo) => sellerInfo.user, {
    cascade: [Cascade.ALL],
    eager: true,
    nullable: true,
    mappedBy: 'user',
  })
  sellerInfo?: SellerInfo;

  @OneToMany(() => SellerUserBlock, (block) => block.seller, { cascade: [Cascade.ALL] })
  blockedUsersByMe = new Collection<SellerUserBlock>(this);

  @OneToMany(() => SellerUserBlock, (block) => block.blockedUser, { cascade: [Cascade.ALL] })
  blockingSellersOfMe = new Collection<SellerUserBlock>(this);
}

