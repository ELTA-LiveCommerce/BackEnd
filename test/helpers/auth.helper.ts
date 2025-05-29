import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import * as bcrypt from 'bcryptjs';

import { UserRole } from '@/shared/enum/user-role.enum';
import { User } from '@/module/user/entity/user.entity';
import { AuthService } from '@/module/auth/auth.service';

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
  userId = 'test-user-id',
  email = 'test@example.com',
  role = UserRole.VIEWER,
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

/**
 * 테스트용 사용자를 생성합니다
 *
 * @param em Entity Manager
 * @param userData 사용자 데이터
 * @returns 생성된 사용자
 */
export async function createTestUser(
  em: EntityManager,
  userData: Partial<User> & { loginId: string; password: string; name: string },
): Promise<User> {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const user = em.create(User, {
    ...userData,
    password: hashedPassword,
  });
  
  await em.persistAndFlush(user);
  return user;
}

/**
 * 테스트용 사용자로 로그인하여 토큰을 받습니다
 *
 * @param authService Auth 서비스
 * @param user 사용자
 * @returns JWT 토큰
 */
export async function loginTestUser(authService: AuthService, user: User): Promise<string> {
  return authService.generateAccessToken(user);
}
