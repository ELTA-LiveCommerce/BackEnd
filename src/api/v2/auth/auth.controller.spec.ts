import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from '../../../module/auth/auth.service';
import { V2LoginRequestDto, V2LoginResponseDto } from '../../../module/auth/dto/v2-login.dto';
import { TokenResponseDto } from '../../../module/auth/dto/auth.dto';
import { KakaoCodeRequestDto, KakaoAccessTokenRequestDto } from '../../../module/auth/dto/kakao-auth.dto';
import { AppleAuthCodeRequestDto, AppleIdentityTokenRequestDto } from '../../../module/auth/dto/apple-auth.dto';
import { JwtAuthGuard } from '../../../module/auth/guards/jwt-auth.guard';
// 필요한 경우 KakaoAuthGuard, AppleAuthGuard 등을 import

describe('AuthControllerV2', () => {
  let controller: AuthController;
  let authService: DeepMocked<AuthService>;
  let configService: DeepMocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: createMock<AuthService>(),
        },
        {
          provide: ConfigService,
          useValue: createMock<ConfigService>(),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      // 다른 Guard가 사용된다면 여기서 모킹 추가
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);

    // ConfigService 기본 모킹 설정
    configService.get.mockImplementation((key: string) => {
      if (key === 'kakao.clientId') return 'test-kakao-client-id';
      if (key === 'kakao.callbackUrl') return 'http://localhost/kakao/callback';
      if (key === 'apple.clientId') return 'test-apple-client-id';
      if (key === 'apple.callbackUrl') return 'http://localhost/apple/callback';
      return undefined;
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return JWT token on successful login', async () => {
      const loginDto: V2LoginRequestDto = { loginId: 'test', password: 'password' };
      const expectedResponse: V2LoginResponseDto = { accessToken: 'test-token' };
      authService.loginV2.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);
      expect(authService.loginV2).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('logout', () => {
    it('should return a success message on logout', async () => {
      const req = {}; // 실제 req 객체는 복잡하므로, 테스트에서는 Guard가 통과했다고 가정하고 간단히 모킹
      const result = await controller.logout(req);
      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('kakaoLogin (Web)', () => {
    it('should redirect to Kakao auth URL', () => {
      const mockResponse = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(), // status().send() 체이닝을 위해 this 반환
        send: jest.fn(),
      } as unknown as Response;

      controller.kakaoLogin(mockResponse);
      expect(configService.get).toHaveBeenCalledWith('kakao.clientId');
      expect(configService.get).toHaveBeenCalledWith('kakao.callbackUrl');
      expect(mockResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('kauth.kakao.com'));
    });

    it('should return 500 if Kakao config is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'kakao.clientId') return undefined;
        return 'http://localhost/kakao/callback';
      });
      const mockResponse = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      controller.kakaoLogin(mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.send).toHaveBeenCalledWith('카카오 로그인 설정 오류');
    });
  });

  describe('kakaoLoginCallback (Web)', () => {
    it('should return token on successful callback', async () => {
      const code = 'test-kakao-code';
      const expectedResponse: TokenResponseDto = {
        access_token: 'jwt-token',
        refresh_token: 'jwt-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };
      authService.handleKakaoAuthorizationCode.mockResolvedValue(expectedResponse);

      const result = await controller.kakaoLoginCallback(code);
      expect(authService.handleKakaoAuthorizationCode).toHaveBeenCalledWith(code);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw UnauthorizedException if code is missing', async () => {
      await expect(controller.kakaoLoginCallback(undefined as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if error query is present', async () => {
      await expect(controller.kakaoLoginCallback('any-code', 'some_error')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('kakaoLoginMobileWithCode', () => {
    it('should return token for mobile Kakao login with code', async () => {
      const dto: KakaoCodeRequestDto = { code: 'mobile-kakao-code' };
      const expectedResponse: TokenResponseDto = { access_token: 'jwt-token', expires_in: 3600, token_type: 'bearer' };
      authService.handleKakaoAuthorizationCode.mockResolvedValue(expectedResponse);

      const result = await controller.kakaoLoginMobileWithCode(dto);
      expect(authService.handleKakaoAuthorizationCode).toHaveBeenCalledWith(dto.code);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('kakaoLoginMobileWithToken', () => {
    it('should return token for mobile Kakao login with access token', async () => {
      const dto: KakaoAccessTokenRequestDto = { accessToken: 'mobile-kakao-access-token' };
      const expectedResponse: TokenResponseDto = { access_token: 'jwt-token', expires_in: 3600, token_type: 'bearer' };
      authService.handleKakaoAccessToken.mockResolvedValue(expectedResponse);

      const result = await controller.kakaoLoginMobileWithToken(dto);
      expect(authService.handleKakaoAccessToken).toHaveBeenCalledWith(dto.accessToken);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('appleLogin (Web)', () => {
    it('should redirect to Apple auth URL', () => {
      const mockResponse = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      controller.appleLogin(mockResponse, 'test-state');
      expect(configService.get).toHaveBeenCalledWith('apple.clientId');
      expect(configService.get).toHaveBeenCalledWith('apple.callbackUrl');
      expect(mockResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('appleid.apple.com'));
      expect(mockResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('state=test-state'));
      expect(mockResponse.redirect).toHaveBeenCalledWith(expect.stringContaining('nonce='));
    });

    it('should return 500 if Apple config is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'apple.clientId') return undefined;
        return 'http://localhost/apple/callback';
      });
      const mockResponse = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      controller.appleLogin(mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.send).toHaveBeenCalledWith('Apple 로그인 설정 오류 (Web)');
    });
  });

  describe('appleLoginCallback (Web)', () => {
    it('should return token on successful Apple callback', async () => {
      const dto: AppleAuthCodeRequestDto = {
        code: 'apple-code',
        id_token: 'apple-id-token',
        user: '{"name":{"firstName":"Test","lastName":"User"}}',
      };
      const expectedResponse: TokenResponseDto = { access_token: 'jwt-token', expires_in: 3600, token_type: 'bearer' };
      authService.handleAppleAuthCode.mockResolvedValue(expectedResponse);

      const result = await controller.appleLoginCallback(dto, {});
      expect(authService.handleAppleAuthCode).toHaveBeenCalledWith(dto.code, dto.id_token, JSON.parse(dto.user!));
      expect(result).toEqual(expectedResponse);
    });

    it('should throw UnauthorizedException if code is missing in Apple callback', async () => {
      const dto: AppleAuthCodeRequestDto = { id_token: 'apple-id-token', code: '' };
      await expect(controller.appleLoginCallback(dto, {})).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('appleLoginMobileWithCode', () => {
    it('should return token for mobile Apple login with code', async () => {
      const dto: AppleAuthCodeRequestDto = {
        code: 'apple-mobile-code',
        id_token: 'id-token',
        user: '{"email":"test@apple.com"}',
      };
      const expectedResponse: TokenResponseDto = { access_token: 'jwt-token', expires_in: 3600, token_type: 'bearer' };
      authService.handleAppleAuthCode.mockResolvedValue(expectedResponse);

      const result = await controller.appleLoginMobileWithCode(dto);
      expect(authService.handleAppleAuthCode).toHaveBeenCalledWith(dto.code, dto.id_token, JSON.parse(dto.user!));
      expect(result).toEqual(expectedResponse);
    });

    it('should throw UnauthorizedException if code is missing', async () => {
      const dto: AppleAuthCodeRequestDto = { id_token: 'id-token', code: '' };
      await expect(controller.appleLoginMobileWithCode(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('appleLoginMobileWithIdentityToken', () => {
    it('should return token for mobile Apple login with identity token', async () => {
      const dto: AppleIdentityTokenRequestDto = { identityToken: 'apple-identity-token', email: 'test@test.com' };
      const expectedResponse: TokenResponseDto = { access_token: 'jwt-token', expires_in: 3600, token_type: 'bearer' };
      authService.handleAppleIdentityToken.mockResolvedValue(expectedResponse);

      const result = await controller.appleLoginMobileWithIdentityToken(dto);
      expect(authService.handleAppleIdentityToken).toHaveBeenCalledWith(dto.identityToken, dto.authorizationCode, {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      expect(result).toEqual(expectedResponse);
    });
  });
});
