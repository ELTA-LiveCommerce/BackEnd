import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

import { AuthService } from '@/module/auth/auth.service';
import { LoginDto, RefreshTokenDto, TokenResponseDto } from '@/module/auth/dto/auth.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    const authResponse = await this.authService.validateUser(loginDto.email, loginDto.password);

    return {
      access_token: authResponse.access_token,
      refresh_token: authResponse.refresh_token,
      expires_in: 15 * 60, // 15분 (초 단위)
      token_type: 'bearer',
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    return await this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Req() req: Request): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    const token = authHeader.split(' ')[1];
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }

    await this.authService.logout(token, userId);
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin() {
    // 카카오 로그인 페이지로 리다이렉트 (PassportStrategy에서 처리)
    return;
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(@Req() req: Request, @Res() res: Response) {
    // 프론트엔드 리다이렉트 URL (환경변수로 관리하는 것이 좋음)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // req.user는 KakaoStrategy의 validate 메서드에서 반환한 값
    const { access_token, refresh_token } = req.user as { access_token: string; refresh_token: string };

    // 토큰을 쿠키에 저장하고 프론트엔드로 리다이렉트
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.redirect(frontendUrl);
  }
}
