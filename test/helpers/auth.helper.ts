import { JwtService } from '@nestjs/jwt';

import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * 테스트용 JWT 토큰을 생성합니다
 *
 * @param jwtService JWT 서비스
 * @param userId 사용자 ID
 * @param email 사용자 이메일
 * @param role 사용자 역할
 * @returns JWT 토큰
 */
export function generateTestToken(
  jwtService: JwtService,
  userId: string = 'test-user-id',
  email: string = 'test@example.com',
  role: UserRole = UserRole.VIEWER,
): string {
  return jwtService.sign({
    sub: userId,
    email,
    role,
  });
}

/**
 * 카카오 로그인 응답 객체를 생성합니다
 *
 * @param userId 사용자 ID
 * @param email 사용자 이메일
 * @param name 사용자 이름
 * @param role 사용자 역할
 * @param accessToken 액세스 토큰
 * @returns 카카오 로그인 응답 객체
 */
export function createKakaoAuthResponse(
  userId: string = 'test-user-id',
  email: string = 'test@example.com',
  name: string = 'Test User',
  role: UserRole = UserRole.VIEWER,
  accessToken: string = 'test-access-token',
) {
  return {
    id: userId,
    email,
    name,
    role,
    access_token: accessToken,
  };
}
