import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { ProfileController } from '@/api/user/profile.controller';
import { UserController } from '@/api/user/user.controller';
import { UserModule } from '@/module/user/user.module';

@Module({
  imports: [
    UserModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UserController, ProfileController],
})
export class UserControllerModule {}
