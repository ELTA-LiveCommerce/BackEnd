import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * User 엔티티를 위한 테스트 팩토리
 *
 * @param overrides 기본값을 오버라이드하는 속성들
 * @returns User 객체
 */
export function createUserFactory(overrides: Partial<User> = {}): User {
  const user = new User();

  user.id = overrides.id || v4();
  user.email = overrides.email || `test-${v4().slice(0, 8)}@example.com`;
  user.name = overrides.name || 'Test User';
  user.password = overrides.password || 'hashedPassword';
  user.role = overrides.role || UserRole.VIEWER;
  user.isVerified = overrides.isVerified ?? false;
  user.phoneNumber = overrides.phoneNumber;
  user.profileImage = overrides.profileImage;
  user.accountNumber = overrides.accountNumber;
  user.bankName = overrides.bankName;
  user.createdAt = overrides.createdAt || new Date();
  user.updatedAt = overrides.updatedAt || new Date();

  return user;
}
