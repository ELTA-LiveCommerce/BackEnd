import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Follow } from '@/module/user/entity/follow.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserFollowService } from '@/module/user/user-follow.service';
import { UserService } from '@/module/user/user.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, Follow])],
  providers: [UserService, UserFollowService],
  exports: [UserService, UserFollowService],
})
export class UserModule {}
