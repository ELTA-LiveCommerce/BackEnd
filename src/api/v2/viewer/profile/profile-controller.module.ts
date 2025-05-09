import { Module } from '@nestjs/common';

import { UserModule } from '@/module/user/user.module';

import { ProfileController } from './profile.controller';

@Module({
  imports: [UserModule],
  controllers: [ProfileController],
})
export class ProfileControllerModule {}
