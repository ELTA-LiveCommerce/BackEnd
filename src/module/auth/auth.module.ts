import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';

import { UserModule } from '@/module/user/user.module';

import { AuthService } from './auth.service';
import { Login } from './entity/login.entity';
import { TokenBlacklist } from './entity/token-blacklist.entity';
import { LoginService } from './login.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { TokenBlacklistService } from './token-blacklist.service';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    HttpModule,
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
  providers: [AuthService, LoginService, TokenBlacklistService, KakaoStrategy, JwtStrategy, OptionalJwtAuthGuard],
  exports: [AuthService, LoginService, TokenBlacklistService, OptionalJwtAuthGuard],
})
export class AuthModule {}
