import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Follow } from '@/module/user/entity/follow.entity';
import { User } from '@/module/user/entity/user.entity';
import { FollowService } from '@/module/user/follow.service';
import { UserService } from '@/module/user/user.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, Follow])],
  providers: [UserService, FollowService],
  exports: [UserService, FollowService],
})
export class UserModule {}
