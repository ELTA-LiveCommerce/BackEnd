import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UserModule } from '@/module/user/user.module';

import { AuthService } from './auth.service';
import { Login } from './entity/login.entity';
import { TokenBlacklist } from './entity/token-blacklist.entity';
import { LoginService } from './login.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    MikroOrmModule.forFeature([Login, TokenBlacklist]),
    UserModule,
  ],
  providers: [AuthService, LoginService, TokenBlacklistService, KakaoStrategy, JwtStrategy],
  exports: [AuthService, LoginService, TokenBlacklistService],
})
export class AuthModule {}
