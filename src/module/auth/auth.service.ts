import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { TokenResponseDto } from './dto/auth.dto';
import { KakaoUserDto, KakaoUserInfo } from './dto/kakao-auth.dto';
import { LoginProvider } from './entity/login.entity';
import { LoginService } from './login.service';
import { TokenBlacklistService } from './token-blacklist.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

interface AuthResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  access_token: string;
  refresh_token?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRATION = '15m'; // 액세스 토큰 만료 시간
  private readonly REFRESH_TOKEN_EXPIRATION = '7d'; // 리프레시 토큰 만료 시간

  constructor(
    private readonly userService: UserService,
    private readonly loginService: LoginService,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async validateKakaoUser(kakaoUserDto: KakaoUserDto): Promise<AuthResponse> {
    try {
      // 새로 구현한 메서드 활용
      const user = await this.validateKakaoUserAndGetUser(kakaoUserDto);

      // 인증 응답 생성
      return this.buildAuthResponse(user, true);
    } catch (error) {
      this.logger.error(
        `카카오 인증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('카카오 인증에 실패했습니다.');
    }
  }

  async validateUser(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.buildAuthResponse(user, true);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // 토큰 블랙리스트 확인
      const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('만료된 리프레시 토큰입니다.');
      }

      // 리프레시 토큰 검증
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      // 사용자 조회
      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 새 토큰 발급
      const tokens = this.generateTokens(user);

      // 리프레시 토큰 저장 (소셜 로그인이 아닌 경우)
      const login = await this.loginService.findByProviderId(LoginProvider.EMAIL, user.email);
      if (login) {
        await this.loginService.updateLoginInfo(login, {
          refreshToken: tokens.refresh_token,
        });
      } else {
        await this.loginService.createLoginInfo(user, LoginProvider.EMAIL, user.email, {
          email: user.email,
          refreshToken: tokens.refresh_token,
        });
      }

      return tokens;
    } catch (error) {
      this.logger.error(
        `토큰 갱신 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }

  async logout(token: string, userId: string): Promise<void> {
    try {
      // 토큰 디코딩 (검증은 하지 않음)
      const decoded = this.jwtService.decode(token);
      if (!decoded || typeof decoded !== 'object') {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 토큰 블랙리스트에 추가
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.tokenBlacklistService.addToBlacklist(token, userId, expiresAt);

      // 소셜 로그인이 아닌 경우 리프레시 토큰 삭제
      const login = await this.loginService.findByProviderId(LoginProvider.EMAIL, userId);
      if (login) {
        await this.loginService.updateLoginInfo(login, { refreshToken: undefined });
      }

      this.logger.log(`사용자 로그아웃: ${userId}`);
    } catch (error) {
      this.logger.error(
        `로그아웃 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('로그아웃에 실패했습니다.');
    }
  }

  async kakaoMobileLogin(accessToken: string): Promise<TokenResponseDto> {
    try {
      // 카카오 AccessToken을 사용하여 사용자 정보 요청
      const userData: KakaoUserInfo = await this.getKakaoUserInfo(accessToken);

      const kakaoUserDto: KakaoUserDto = {
        kakaoId: userData.id,
        email: userData.kakao_account?.email,
        nickname: userData.kakao_account?.profile?.nickname || userData.properties?.nickname || '카카오 사용자',
        profileImage: userData.kakao_account?.profile?.profile_image_url || userData.properties?.profile_image,
      };

      // 사용자 검증 후 User 객체 반환 (토큰 생성 X)
      const user = await this.validateKakaoUserAndGetUser(kakaoUserDto);

      // 토큰 생성 및 반환
      return this.generateTokens(user);
    } catch (error) {
      this.logger.error(
        `카카오 모바일 로그인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('카카오 모바일 로그인에 실패했습니다.');
    }
  }

  // 사용자 검증 후 User 객체 반환 (토큰 생성 X)
  private async validateKakaoUserAndGetUser(kakaoUserDto: KakaoUserDto): Promise<User> {
    try {
      // 기존 카카오 ID로 등록된 로그인 정보가 있는지 확인
      const login = await this.loginService.findByProviderId(LoginProvider.KAKAO, kakaoUserDto.kakaoId.toString());

      let user: User | null = null;

      // 기존 로그인 정보가 있으면 해당 사용자 정보 반환
      if (login) {
        user = login.user;

        // 로그인 정보 업데이트
        await this.loginService.updateLoginInfo(login, {
          nickname: kakaoUserDto.nickname,
          profileImage: kakaoUserDto.profileImage,
        });
      } else {
        // 이메일로 기존 사용자 찾기
        if (kakaoUserDto.email) {
          user = await this.userService.findByEmail(kakaoUserDto.email);
        }

        // 기존 사용자가 없으면 새로 생성
        if (!user) {
          const createUserDto = {
            email: kakaoUserDto.email || `kakao_${kakaoUserDto.kakaoId}@example.com`,
            name: kakaoUserDto.nickname,
            role: UserRole.VIEWER,
            // 카카오 로그인은 비밀번호가 없으므로 랜덤 문자열 생성
            password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
          };

          user = await this.userService.create(createUserDto);
          this.logger.log(`새 사용자 등록: ${user.id}`);
        }

        // 로그인 정보 생성
        await this.loginService.createLoginInfo(user, LoginProvider.KAKAO, kakaoUserDto.kakaoId.toString(), {
          email: kakaoUserDto.email,
          nickname: kakaoUserDto.nickname,
          profileImage: kakaoUserDto.profileImage,
        });
      }

      if (!user) {
        throw new Error('사용자 생성 또는 로그인 정보 연결에 실패했습니다');
      }

      return user;
    } catch (error) {
      this.logger.error(
        `카카오 인증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('카카오 인증에 실패했습니다.');
    }
  }

  private async getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      // 카카오 API를 통해 사용자 정보 요청
      const response = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      if (!response.ok) {
        throw new Error(`카카오 API 요청 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(
        `카카오 사용자 정보 요청 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('카카오 사용자 정보를 가져오는데 실패했습니다.');
    }
  }

  private buildAuthResponse(user: User, includeRefreshToken = false): AuthResponse {
    const response: AuthResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      access_token: this.generateAccessToken(user),
    };

    if (includeRefreshToken) {
      response.refresh_token = this.generateRefreshToken(user);
    }

    return response;
  }

  private generateTokens(user: User): TokenResponseDto {
    return {
      access_token: this.generateAccessToken(user),
      refresh_token: this.generateRefreshToken(user),
      expires_in: 15 * 60, // 15분 (초 단위)
      token_type: 'bearer',
    };
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: this.ACCESS_TOKEN_EXPIRATION,
    });
  }

  private generateRefreshToken(user: User): string {
    const jti = v4(); // 유니크 ID 생성
    const payload: RefreshTokenPayload = {
      sub: user.id,
      jti,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: this.REFRESH_TOKEN_EXPIRATION,
    });
  }
}
