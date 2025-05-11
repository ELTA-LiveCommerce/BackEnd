import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { TokenResponseDto } from './dto/auth.dto';
import { KakaoUserDto, KakaoUserInfo } from './dto/kakao-auth.dto';
import { V2LoginRequestDto, V2LoginResponseDto } from './dto/v2-login.dto';
import { LoginProvider } from './entity/login.entity';
import { LoginService } from './login.service';
import { TokenBlacklistService } from './token-blacklist.service';

interface JwtPayload {
  sub: string;
  loginId: string;
  role: UserRole;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

interface AuthResponse {
  id: string;
  loginId: string;
  name: string;
  role: UserRole;
  access_token: string;
  refresh_token?: string;
}

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope?: string;
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
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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

  async validateUser(loginId: string, password: string): Promise<AuthResponse> {
    const user = await this.userService.findByLoginId(loginId);
    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.buildAuthResponse(user, true);
  }

  async loginV2(loginRequestDto: V2LoginRequestDto): Promise<V2LoginResponseDto> {
    this.logger.log(`V2 Login attempt for user: ${loginRequestDto.loginId}`);
    const user = await this.userService.findByLoginId(loginRequestDto.loginId);
    if (!user) {
      this.logger.warn(`User not found: ${loginRequestDto.loginId}`);
      throw new UnauthorizedException('사용자 아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(loginRequestDto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${loginRequestDto.loginId}`);
      throw new UnauthorizedException('사용자 아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const accessToken = this.generateAccessToken(user);
    this.logger.log(`V2 Login successful for user: ${loginRequestDto.loginId}`);
    return new V2LoginResponseDto(accessToken);
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
      const login = await this.loginService.findByProviderId(LoginProvider.EMAIL, user.loginId);
      if (login) {
        await this.loginService.updateLoginInfo(login, {
          refreshToken: tokens.refresh_token,
        });
      } else {
        await this.loginService.createLoginInfo(user, LoginProvider.EMAIL, user.loginId, {
          loginId: user.loginId,
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
        // loginId로 기존 사용자 찾기 (카카오에서 email을 loginId로 사용한다고 가정)
        if (kakaoUserDto.email) {
          // 카카오가 email을 제공하면 그것을 loginId로 시도
          user = await this.userService.findByLoginId(kakaoUserDto.email);
        }

        // 기존 사용자가 없으면 새로 생성
        if (!user) {
          const createUserDto = {
            loginId: kakaoUserDto.email || `kakao_${kakaoUserDto.kakaoId}`, // email -> loginId, 임시 loginId 생성 규칙 변경
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
          loginId: user.loginId, // email -> loginId
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

  private async getKakaoUserInfo(kakaoAccessToken: string): Promise<KakaoUserInfo> {
    const KAKAO_USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';
    try {
      const response = await this.httpService
        .get<KakaoUserInfo>(KAKAO_USER_INFO_URL, {
          headers: { Authorization: `Bearer ${kakaoAccessToken}` },
        })
        .toPromise(); // RxJS 최신 버전에서는 firstValueFrom 사용 권장

      if (!response || !response.data) {
        throw new Error('카카오 사용자 정보 응답 없음');
      }
      return response.data;
    } catch (error) {
      this.logger.error(`카카오 사용자 정보 요청 실패: ${error.message}`, error.stack);
      if (error.response?.data) {
        this.logger.error(`카카오 오류 응답: ${JSON.stringify(error.response.data)}`);
      }
      throw new UnauthorizedException('카카오 사용자 정보 조회에 실패했습니다.');
    }
  }

  // 인가 코드를 받아 카카오 로그인 처리 후 JWT 반환
  async handleKakaoAuthorizationCode(code: string): Promise<TokenResponseDto> {
    const kakaoTokenResponse = await this.getKakaoAccessToken(code);
    const kakaoUserInfo = await this.getKakaoUserInfo(kakaoTokenResponse.access_token);

    const user = await this.processKakaoUser(kakaoUserInfo);
    return this.generateTokens(user);
  }

  // 카카오 AccessToken을 직접 받아 카카오 로그인 처리 후 JWT 반환 (기존 kakaoMobileLogin 역할)
  async handleKakaoAccessToken(kakaoAccessToken: string): Promise<TokenResponseDto> {
    const kakaoUserInfo = await this.getKakaoUserInfo(kakaoAccessToken);
    const user = await this.processKakaoUser(kakaoUserInfo);
    return this.generateTokens(user);
  }

  // processKakaoUser: 카카오 사용자 정보를 바탕으로 User 엔티티를 찾거나 생성 (기존 validateKakaoUserAndGetUser 역할)
  private async processKakaoUser(kakaoUserInfo: KakaoUserInfo): Promise<User> {
    const kakaoUserDto: KakaoUserDto = {
      kakaoId: kakaoUserInfo.id,
      email: kakaoUserInfo.kakao_account?.email,
      nickname: kakaoUserInfo.kakao_account?.profile?.nickname || kakaoUserInfo.properties?.nickname || '카카오 사용자',
      profileImage: kakaoUserInfo.kakao_account?.profile?.profile_image_url || kakaoUserInfo.properties?.profile_image,
    };

    // 기존 validateKakaoUserAndGetUser 로직 활용 (약간 수정)
    const login = await this.loginService.findByProviderId(LoginProvider.KAKAO, kakaoUserDto.kakaoId.toString());
    let user: User | null = null;

    if (login) {
      user = login.user;
      if (!user) {
        // Login 엔티티는 있으나 연결된 User가 없는 비정상적인 경우
        this.logger.error(`카카오 로그인: Login 엔티티(ID: ${login.id})에 연결된 사용자가 없습니다.`);
        // 이 경우, loginId를 기반으로 사용자를 다시 찾아보거나, 오류를 발생시킬 수 있습니다.
        // 우선은 오류를 발생시키지 않고 신규 사용자 생성 로직으로 넘어가지 않도록 user를 null로 유지합니다.
        // 또는 login 정보를 삭제하고 신규로 진행하도록 할 수도 있습니다.
        throw new InternalServerErrorException('카카오 로그인 처리 중 사용자 정보 연결 오류가 발생했습니다.');
      }
      await this.loginService.updateLoginInfo(login, {
        nickname: kakaoUserDto.nickname,
        profileImage: kakaoUserDto.profileImage,
        // 필요한 경우 카카오로부터 받은 새로운 access/refresh 토큰을 login 엔티티에 저장할 수 있으나,
        // 현재는 우리 서비스의 JWT를 사용하므로 카카오 토큰을 저장하지 않음.
      });
      this.logger.log(`기존 카카오 연동 사용자 로그인: ${user.id} (Login ID: ${login.id})`);
    } else {
      if (kakaoUserDto.email) {
        user = await this.userService.findByLoginId(kakaoUserDto.email);
        if (user) {
          this.logger.log(`기존 사용자 (${user.id})에게 카카오 계정(${kakaoUserDto.kakaoId}) 연동`);
        } else {
          this.logger.log(`신규 사용자 등록 (카카오 이메일 기반): ${kakaoUserDto.email}`);
        }
      }

      if (!user) {
        // 기존 사용자가 없거나, 이메일이 없어 찾지 못한 경우 신규 생성
        const newLoginId = kakaoUserDto.email || `kakao_${kakaoUserDto.kakaoId}`;
        // loginId 중복 가능성 체크 (매우 드물지만)
        const existingUserWithTempLoginId = await this.userService.findByLoginId(newLoginId);
        if (existingUserWithTempLoginId) {
          this.logger.error(
            `생성하려는 임시 카카오 loginId(${newLoginId})가 이미 존재합니다. 사용자 ID: ${existingUserWithTempLoginId.id}`,
          );
          throw new InternalServerErrorException('카카오 로그인 처리 중 오류가 발생했습니다.');
        }

        user = await this.userService.create({
          loginId: newLoginId,
          name: kakaoUserDto.nickname,
          role: UserRole.VIEWER,
          password: await bcrypt.hash(v4(), 10), // 임의의 초기 비밀번호 설정
          profileImage: kakaoUserDto.profileImage,
        });
        this.logger.log(`신규 사용자 생성 (카카오): ${user.id}, LoginId: ${user.loginId}`);
      }

      await this.loginService.createLoginInfo(user, LoginProvider.KAKAO, kakaoUserDto.kakaoId.toString(), {
        loginId: user.loginId,
        nickname: kakaoUserDto.nickname,
        profileImage: kakaoUserDto.profileImage,
      });
      this.logger.log(`새로운 카카오 Login 정보 생성 (사용자 ID: ${user.id})`);
    }

    if (!user) {
      // 이 지점에 도달하면 로직 오류
      this.logger.error('카카오 로그인 처리 중 최종 사용자 객체를 확정하지 못했습니다.', kakaoUserDto);
      throw new InternalServerErrorException('카카오 로그인 처리에 실패했습니다.');
    }
    return user;
  }

  private buildAuthResponse(user: User, includeRefreshToken = false): AuthResponse {
    const response: AuthResponse = {
      id: user.id,
      loginId: user.loginId,
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
      loginId: user.loginId,
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

  private async getKakaoAccessToken(
    code: string,
    grantType: string = 'authorization_code',
  ): Promise<KakaoTokenResponse> {
    const KAKAO_CLIENT_ID = this.configService.get<string>('kakao.clientId');
    const KAKAO_CALLBACK_URL = this.configService.get<string>('kakao.callbackUrl');
    const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';

    if (!KAKAO_CLIENT_ID || !KAKAO_CALLBACK_URL) {
      this.logger.error('카카오 환경변수(KAKAO_CLIENT_ID 또는 KAKAO_CALLBACK_URL)가 설정되지 않았습니다.');
      throw new InternalServerErrorException('카카오 로그인 설정 오류');
    }

    try {
      const response = await this.httpService
        .post(
          KAKAO_TOKEN_URL,
          {
            grant_type: grantType,
            client_id: KAKAO_CLIENT_ID,
            redirect_uri: KAKAO_CALLBACK_URL,
            code,
          },
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
          },
        )
        .toPromise(); // toPromise() 대신 firstValueFrom 사용 권장 (최신 RxJS)

      if (!response || !response.data) {
        throw new Error('카카오 토큰 응답 없음');
      }
      return response.data as KakaoTokenResponse;
    } catch (error) {
      this.logger.error(`카카오 액세스 토큰 요청 실패: ${error.message}`, error.stack);
      if (error.response?.data) {
        this.logger.error(`카카오 오류 응답: ${JSON.stringify(error.response.data)}`);
      }
      throw new UnauthorizedException('카카오 토큰 발급에 실패했습니다.');
    }
  }
}
