import { Module } from '@nestjs/common';
import { AdminProductController } from './admin-product.controller';
import { ProductModule } from '@/module/product/product.module';
import { AuthModule } from '@/module/auth/auth.module';
import { UserModule } from '@/module/user/user.module';

@Module({
  imports: [ProductModule, AuthModule, UserModule],
  controllers: [AdminProductController],
})
export class AdminProductControllerModule {}

