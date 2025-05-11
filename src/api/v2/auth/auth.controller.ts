import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from '../../../module/auth/auth.service';
import { V2LoginRequestDto, V2LoginResponseDto } from '../../../module/auth/dto/v2-login.dto';
import { JwtAuthGuard } from '../../../module/auth/guards/jwt-auth.guard';

@ApiTags('Auth v2')
@Controller({
  path: 'auth',
  version: '2',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'V2 사용자 로그인',
    description: '사용자 아이디와 비밀번호로 로그인하여 JWT를 발급받습니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '로그인 성공 및 JWT 토큰 발급', type: V2LoginResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  async login(@Body() loginRequestDto: V2LoginRequestDto): Promise<V2LoginResponseDto> {
    return this.authService.loginV2(loginRequestDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'V2 사용자 로그아웃',
    description:
      '현재 로그인된 사용자를 로그아웃 처리합니다. 서버에서는 별도의 토큰 무효화를 수행하지 않으며, 클라이언트에서 토큰을 삭제해야 합니다.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: '로그아웃 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 사용자' })
  async logout(@Req() req: any): Promise<{ message: string }> {
    return { message: 'Successfully logged out' };
  }

  // TODO: Implement other v2 authentication endpoints (e.g., refresh token, logout)
}
