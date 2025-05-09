import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { UserModule } from '@/module/user/user.module';

import { ProfileController } from './profile.controller';
import { SearchController } from './search.controller';
import { UserController } from './user.controller';

@Module({
  imports: [
    UserModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UserController, ProfileController, SearchController],
})
export class UserControllerModule {}
