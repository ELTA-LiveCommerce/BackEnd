import { v4 } from 'uuid';

import { Login, LoginProvider } from '@/module/auth/entity/login.entity';
import { User } from '@/module/user/entity/user.entity';

import { createUserFactory } from './user.factory';

/**
 * Login 엔티티를 위한 테스트 팩토리
 *
 * @param overrides 기본값을 오버라이드하는 속성들
 * @returns Login 객체
 */
export function createLoginFactory(overrides: Partial<Login> = {}): Login {
  const login = new Login();

  login.id = overrides.id || v4();
  login.user = overrides.user || createUserFactory();
  login.provider = overrides.provider || LoginProvider.KAKAO;
  login.providerId = overrides.providerId || '12345';
  login.email = overrides.email || `provider-${v4().slice(0, 8)}@example.com`;
  login.nickname = overrides.nickname || 'Provider User';
  login.profileImage = overrides.profileImage || 'https://example.com/profile.jpg';
  login.accessToken = overrides.accessToken || 'access-token';
  login.refreshToken = overrides.refreshToken || 'refresh-token';
  login.lastLoginAt = overrides.lastLoginAt || new Date();
  login.createdAt = overrides.createdAt || new Date();
  login.updatedAt = overrides.updatedAt || new Date();

  return login;
}

/**
 * 카카오 로그인을 위한 테스트 팩토리
 *
 * @param user 연결할 사용자
 * @param overrides 기본값을 오버라이드하는 속성들
 * @returns Login 객체
 */
export function createKakaoLoginFactory(user?: User, overrides: Partial<Login> = {}): Login {
  return createLoginFactory({
    user: user || createUserFactory(),
    provider: LoginProvider.KAKAO,
    providerId: overrides.providerId || '12345',
    ...overrides,
  });
}

/**
 * 애플 로그인을 위한 테스트 팩토리
 *
 * @param user 연결할 사용자
 * @param overrides 기본값을 오버라이드하는 속성들
 * @returns Login 객체
 */
export function createAppleLoginFactory(user?: User, overrides: Partial<Login> = {}): Login {
  return createLoginFactory({
    user: user || createUserFactory(),
    provider: LoginProvider.APPLE,
    providerId: overrides.providerId || 'apple.user123',
    ...overrides,
  });
}
