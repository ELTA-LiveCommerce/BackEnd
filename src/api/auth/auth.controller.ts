import { Controller, Post, Get, HttpCode, Body, Request as NestRequest } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport'; // 임시 주석
import { Request, Response } from 'express';

import { AuthService } from '@/module/auth/auth.service';
import { TokenResponseDto } from '@/module/auth/dto/auth.dto';
// import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard'; // 임시 주석
// import { JwtRefreshGuard } from '@/module/auth/guards/jwt-refresh.guard'; // 임시 주석
// import { LocalAuthGuard } from '@/module/auth/guards/local-auth.guard'; // 임시 주석
import { AuthenticatedRequest } from '@/shared/common/interfaces/authenticated-request.interface';
// import { IsNotEmpty, IsString } from 'class-validator'; // 임시 주석

/* // 임시 주석
class KakaoMobileLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
*/

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @UseGuards(LocalAuthGuard) // 임시 주석
  @Post('login')
  @HttpCode(200)
  async login(@NestRequest() req: AuthenticatedRequest): Promise<TokenResponseDto> {
    // return this.authService.login(req.user as User); // 임시 주석
    console.log('Login attempt with user:', req.user);
    // 임시 반환 (실제 AuthService.login 호출 필요)
    return {
      access_token: 'dummy_access_token_login',
      refresh_token: 'dummy_refresh_token_login',
      expires_in: 3600,
      token_type: 'Bearer',
    };
  }

  // @UseGuards(JwtAuthGuard) // 임시 주석
  @Get('profile')
  getProfile(@NestRequest() req: AuthenticatedRequest) {
    return req.user;
  }

  // @UseGuards(JwtRefreshGuard) // 임시 주석
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@NestRequest() req: AuthenticatedRequest): Promise<TokenResponseDto> {
    // return this.authService.refreshToken(req.user as any); // 임시 주석
    console.log('Refresh token attempt with user:', req.user);
    return {
      access_token: 'dummy_access_token_refresh',
      refresh_token: 'dummy_refresh_token_refresh',
      expires_in: 3600,
      token_type: 'Bearer',
    };
  }

  @Post('logout')
  // @UseGuards(JwtAuthGuard) // 임시 주석
  @HttpCode(204)
  async logout(@NestRequest() req: AuthenticatedRequest): Promise<void> {
    const userId = (req.user as any)?.sub || (req.user as any)?.id || (req.user as any)?.id;
    console.log('Logout attempt for userId:', userId);
    // await this.authService.logout(userId as string, 'dummy_token_for_now'); // 임시 주석
    return;
  }

  /* // Kakao 관련 임시 주석
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin() {
    return;
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(@NestRequest() req: AuthenticatedRequest, @Res() res: any) { 
    const { access_token, refresh_token } = req.user as TokenResponseDto;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.cookie('access_token', access_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000, path: '/'});
    res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/'});
    res.redirect(`${frontendUrl}/auth/callback`);
  }
  
  @Post('kakao/mobile')
  async kakaoMobileLogin(@Body() body: any): Promise<TokenResponseDto> { // KakaoMobileLoginDto 대신 any
    // return this.authService.kakaoMobileLogin(body.accessToken); // 임시 주석
    return { access_token: 'dummy_access_token_kakao_mobile', refresh_token: 'dummy_refresh_token_kakao_mobile', expires_in: 3600, token_type: 'Bearer' };
  }
*/
}
