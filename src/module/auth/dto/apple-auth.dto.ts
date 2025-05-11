import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Apple ID Token의 페이로드 주요 내용
 */
export class AppleIdTokenPayloadDto {
  iss: string; // "https://appleid.apple.com"
  sub: string; // 사용자 고유 식별자 (User ID)
  aud: string; // Client ID (Bundle ID 또는 Service ID)
  exp: number; // 만료 타임스탬프
  iat: number; // 발급 타임스탬프
  nonce?: string;
  email?: string;
  email_verified?: string | boolean; // "true", "false" 또는 boolean
  is_private_email?: string | boolean; // "true", "false" 또는 boolean
  auth_time?: number;
  nonce_supported?: boolean;
  real_user_status?: number; // 0: unsupported, 1: unknown, 2: likely real
}

class AppleUserNameDto {
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;
}

class AppleUserRequestDto {
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppleUserNameDto)
  name?: AppleUserNameDto | null;
}

/**
 * Apple 로그인 콜백 또는 모바일 앱에서 전달받는 정보 (code 방식)
 */
export class AppleAuthCodeRequestDto {
  @IsNotEmpty()
  @IsString()
  code: string; // Authorization Code

  @IsOptional()
  @IsString()
  id_token?: string; // Identity Token (웹 콜백 시 함께 전달될 수 있음)

  @IsOptional()
  @IsString() // user 정보는 JSON 문자열로 전달될 수 있음
  user?: string; // 최초 로그인 시 사용자가 동의한 이름, 이메일 (JSON string)

  @IsOptional()
  @IsString()
  state?: string; // CSRF 방지용 state 값 (웹 콜백 시)
}

/**
 * 모바일 앱에서 Apple Identity Token으로 로그인 시 요청 DTO
 */
export class AppleIdentityTokenRequestDto {
  @IsNotEmpty()
  @IsString()
  identityToken: string;

  @IsOptional()
  @IsString()
  authorizationCode?: string; // ID 토큰 재발급 등에 사용될 수 있는 인가 코드 (선택적)

  // Apple은 최초 로그인 시에만 이름/이메일을 제공하므로, 앱에서 이 정보를 받아서 함께 전달할 수 있음
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;
}

// --- 내부 사용 DTOs (Service 레벨) ---

/**
 * Apple Client Secret 생성에 필요한 설정값
 */
export interface AppleClientSecretConfigDto {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
  expiresIn?: string | number; // 예: '2h', 60 * 60 * 2
}

/**
 * Apple 서버로부터 받는 토큰 응답 인터페이스
 */
export interface AppleTokenResponseDto {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string; // 최초 code 교환 시에만 발급될 수 있음
  token_type: 'Bearer';
}
