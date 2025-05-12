import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { User } from './entity/user.entity';
import { Follow } from './entity/follow.entity';
import { SellerUserBlock } from './entity/seller-user-block.entity';
import { ShippingAddress } from './entity/shipping-address.entity';
import { SellerInfo } from './entity/seller-info.entity';

import { UserController } from '../../api/v1/user/user.controller';
import { ProfileController as V1ProfileController } from '../../api/v1/user/profile.controller';

import { UserService } from './user.service';
import { UserFollowService } from './user-follow.service';
import { UserBlockService } from './user-block.service';
import { ShippingAddressService } from './shipping-address.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, Follow, SellerUserBlock, ShippingAddress, SellerInfo])],
  controllers: [UserController, V1ProfileController],
  providers: [UserService, UserFollowService, UserBlockService, ShippingAddressService],
  exports: [UserService, UserFollowService, UserBlockService, ShippingAddressService],
})
export class UserModule {}
