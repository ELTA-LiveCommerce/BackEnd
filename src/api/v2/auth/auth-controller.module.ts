import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthModule } from '../../../module/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AuthController],
})
export class AuthControllerModule {}
