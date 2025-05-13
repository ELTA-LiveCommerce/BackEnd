import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { v4 } from 'uuid';

import { AuthService } from '../../../module/auth/auth.service';
import { V2LoginRequestDto, V2LoginResponseDto } from '../../../module/auth/dto/v2-login.dto';
import { JwtAuthGuard } from '../../../module/auth/guards/jwt-auth.guard';
import { TokenResponseDto } from '../../../module/auth/dto/auth.dto';
import { KakaoCodeRequestDto, KakaoAccessTokenRequestDto } from '../../../module/auth/dto/kakao-auth.dto';
import { AppleAuthCodeRequestDto, AppleIdentityTokenRequestDto } from '../../../module/auth/dto/apple-auth.dto';
import { CreateUserDto } from '@/module/user/dto/create-user.dto';

@ApiTags('Auth v2')
@Controller({
  path: 'auth',
  version: '2',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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

  // --- Kakao Login (Web) ---
  @Get('kakao/login')
  @ApiOperation({
    summary: '카카오 로그인 시작 (웹용)',
    description: '사용자를 카카오 인증 페이지로 리디렉션합니다.',
  })
  @ApiExcludeEndpoint()
  kakaoLogin(@Res() res: Response) {
    const KAKAO_CLIENT_ID = this.configService.get<string>('kakao.clientId');
    const KAKAO_CALLBACK_URL = this.configService.get<string>('kakao.callbackUrl');

    if (!KAKAO_CLIENT_ID || !KAKAO_CALLBACK_URL) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('카카오 로그인 설정 오류');
    }

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_CALLBACK_URL}&response_type=code`;
    res.redirect(kakaoAuthUrl);
  }

  @Get('kakao/callback')
  @ApiOperation({
    summary: '카카오 로그인 콜백 처리 (웹용)',
    description: '카카오 인증 후 인가 코드를 받아 JWT를 발급합니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '카카오 로그인 성공 및 JWT 토큰 발급', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '카카오 인증 실패' })
  async kakaoLoginCallback(@Query('code') code: string, @Query('error') error?: string): Promise<TokenResponseDto> {
    if (error) {
      throw new UnauthorizedException(`카카오 인증 실패: ${error}`);
    }
    if (!code) {
      throw new UnauthorizedException('카카오 인가 코드가 없습니다.');
    }
    return this.authService.handleKakaoAuthorizationCode(code);
  }

  // --- Kakao Login (Mobile) ---
  @Post('kakao/code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '카카오 인가 코드로 로그인 (모바일용)',
    description: '모바일 앱에서 받은 카카오 인가 코드를 전달하여 JWT를 발급받습니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '카카오 로그인 성공 및 JWT 토큰 발급', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '카카오 인증 실패' })
  async kakaoLoginMobileWithCode(@Body() kakaoCodeDto: KakaoCodeRequestDto): Promise<TokenResponseDto> {
    return this.authService.handleKakaoAuthorizationCode(kakaoCodeDto.code);
  }

  @Post('kakao/mobile-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '카카오 액세스 토큰으로 로그인 (모바일용)',
    description: '모바일 앱에서 직접 발급받은 카카오 액세스 토큰을 전달하여 JWT를 발급받습니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '카카오 로그인 성공 및 JWT 토큰 발급', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '카카오 인증 실패' })
  async kakaoLoginMobileWithToken(@Body() kakaoTokenDto: KakaoAccessTokenRequestDto): Promise<TokenResponseDto> {
    return this.authService.handleKakaoAccessToken(kakaoTokenDto.accessToken);
  }

  // --- Apple Login (Web) ---
  @Get('apple/login')
  @ApiOperation({
    summary: 'Apple 로그인 시작 (웹용)',
    description:
      '사용자를 Apple 인증 페이지로 리디렉션합니다. state와 nonce는 CSRF 방어 및 ID 토큰 유효성 검증에 사용될 수 있습니다.',
  })
  @ApiExcludeEndpoint()
  appleLogin(@Res() res: Response, @Query('state') state?: string) {
    const clientId = this.configService.get<string>('apple.clientId');
    const callbackUrl = this.configService.get<string>('apple.callbackUrl');

    if (!clientId || !callbackUrl) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Apple 로그인 설정 오류 (Web)');
    }

    const nonce = v4();
    let appleAuthUrl = `https://appleid.apple.com/auth/authorize?response_type=code id_token&response_mode=form_post&client_id=${clientId}&redirect_uri=${callbackUrl}&scope=name email&nonce=${nonce}`;
    if (state) {
      appleAuthUrl += `&state=${state}`;
    }
    res.redirect(appleAuthUrl);
  }

  @Post('apple/callback')
  @ApiOperation({
    summary: 'Apple 로그인 콜백 처리 (웹용)',
    description:
      'Apple 인증 후 인가 코드, ID 토큰 등을 받아 JWT를 발급합니다. Content-Type은 application/x-www-form-urlencoded 입니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apple 로그인 성공 및 JWT 토큰 발급', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Apple 인증 실패' })
  @ApiExcludeEndpoint()
  async appleLoginCallback(
    @Body() appleAuthCodeDto: AppleAuthCodeRequestDto,
    @Req() req: any,
  ): Promise<TokenResponseDto> {
    const { code, id_token, user, state } = appleAuthCodeDto;
    if (!code) {
      throw new UnauthorizedException('Apple Authorization Code가 없습니다.');
    }

    let parsedUserPayload;
    if (user) {
      try {
        parsedUserPayload = JSON.parse(user);
      } catch (e) {
        this.authService.logger.warn('Apple user payload 파싱 실패', user);
      }
    }

    return this.authService.handleAppleAuthCode(code, id_token, parsedUserPayload);
  }

  // --- Apple Login (Mobile) ---
  @Post('apple/mobile/code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apple 인가 코드/ID 토큰으로 로그인 (모바일용)',
    description: '모바일 앱에서 받은 Apple 인가 코드와 선택적으로 ID 토큰, 사용자 정보를 전달하여 JWT를 발급받습니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apple 로그인 성공 및 JWT 토큰 발급', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Apple 인증 실패' })
  async appleLoginMobileWithCode(@Body() appleAuthDto: AppleAuthCodeRequestDto): Promise<TokenResponseDto> {
    const { code, id_token, user } = appleAuthDto;
    if (!code) {
      throw new UnauthorizedException('Apple Authorization Code가 필요합니다.');
    }
    let parsedUserPayload;
    if (user) {
      try {
        parsedUserPayload = JSON.parse(user);
      } catch (e) {
        this.authService.logger.warn('Apple user payload 파싱 실패 (모바일/코드)', user);
      }
    }
    return this.authService.handleAppleAuthCode(code, id_token, parsedUserPayload);
  }

  @Post('apple/mobile/identity-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apple ID 토큰으로 로그인 (모바일용)',
    description: '모바일 앱에서 직접 발급받은 Apple ID 토큰과 선택적으로 사용자 정보를 전달하여 JWT를 발급받습니다.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apple 로그인 성공 및 JWT 토큰 발급', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Apple 인증 실패' })
  async appleLoginMobileWithIdentityToken(
    @Body() appleTokenDto: AppleIdentityTokenRequestDto,
  ): Promise<TokenResponseDto> {
    const { identityToken, authorizationCode, email, firstName, lastName } = appleTokenDto;
    return this.authService.handleAppleIdentityToken(identityToken, authorizationCode, { email, firstName, lastName });
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'V2 사용자 회원가입',
    description: '사용자 정보를 입력하여 회원가입을 진행합니다.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '회원가입 성공' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 존재하는 사용자' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 사용자' })
  async register(@Body() createUserDto: CreateUserDto): Promise<any> {
    await this.authService.createUser(createUserDto);
    return { success: true, message: 'success register' };
  }

  // TODO: Implement other v2 authentication endpoints (e.g., refresh token)
}
