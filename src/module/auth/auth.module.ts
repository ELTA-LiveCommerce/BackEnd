import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
      }),
      inject: [ConfigService],
    }),
    MikroOrmModule.forFeature([Login, TokenBlacklist]),
    UserModule,
  ],
  providers: [AuthService, LoginService, TokenBlacklistService, KakaoStrategy, JwtStrategy],
  exports: [AuthService, LoginService, TokenBlacklistService],
})
export class AuthModule {}
