import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { v4 } from 'uuid';

import { UserStatus } from '../../../module/user/dto/update-user-status.dto';
import { User } from '../../../module/user/entity/user.entity';
import { UserRole } from '../../../shared/enum/user-role.enum';

/**
 * 테스트용 사용자 데이터를 생성하는 시더
 */
export class Test000UserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const now = new Date();

    // 관리자 생성
    const admin = em.create(User, {
      id: v4(),
      email: 'admin@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '관리자',
      role: UserRole.ADMIN,
      isVerified: true,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    // 판매자 생성
    const seller = em.create(User, {
      id: v4(),
      email: 'seller@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '판매자',
      role: UserRole.SELLER,
      isVerified: true,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    // 일반 사용자 생성
    const viewer = em.create(User, {
      id: v4(),
      email: 'viewer@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '일반 사용자',
      role: UserRole.VIEWER,
      isVerified: true,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    // 추가 테스트 사용자들
    const testViewer = em.create(User, {
      id: v4(),
      email: 'test-viewer@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '테스트 뷰어',
      role: UserRole.VIEWER,
      isVerified: true,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    const testSeller = em.create(User, {
      id: v4(),
      email: 'test-seller@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '테스트 판매자',
      role: UserRole.SELLER,
      isVerified: true,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    const testProfileViewer = em.create(User, {
      id: v4(),
      email: 'test-profile-viewer@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '프로필 테스트 사용자',
      role: UserRole.VIEWER,
      isVerified: true,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    // 엔티티 저장
    em.persistAndFlush([admin, seller, viewer, testViewer, testSeller, testProfileViewer]);
  }
}
