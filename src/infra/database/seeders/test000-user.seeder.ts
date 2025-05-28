import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcrypt';
import { User } from '../../../module/user/entity/user.entity';
import { UserRole } from '../../../shared/enum/user-role.enum';

/**
 * 테스트용 사용자 데이터를 생성하는 시더
 */
export class Test000UserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const saltRounds = 10;
    const password = await bcrypt.hash('test1234', saltRounds);

    const adminUser = em.create(User, {
      id: 'test-admin-uuid',
      loginId: 'admin@example.com',
      password: password,
      name: '관리자',
      role: UserRole.ADMIN,
      
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sellerUser = em.create(User, {
      id: 'test-seller-uuid',
      loginId: 'seller@example.com',
      password: password,
      name: '판매자일',
      role: UserRole.SELLER,
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const viewerUser = em.create(User, {
      id: 'test-viewer-uuid',
      loginId: 'viewer@example.com',
      password: password,
      name: '구매자일',
      role: UserRole.VIEWER,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
    });

    const testViewer = em.create(User, {
      id: 'test-viewer-uuid-for-follow',
      loginId: 'test-viewer@example.com',
      password: password,
      name: '팔로우 테스트 구매자',
      role: UserRole.VIEWER,
      isVerified: true,
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const testSeller = em.create(User, {
      id: 'test-seller-uuid-for-follow',
      loginId: 'test-seller@example.com',
      password: password,
      name: '팔로우 테스트 판매자',
      role: UserRole.SELLER,
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const testProfileViewer = em.create(User, {
      id: 'test-profile-viewer-uuid',
      loginId: 'test-profile-viewer@example.com',
      password: password,
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
      name: '프로필 테스트 구매자',
      role: UserRole.VIEWER,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await em.persistAndFlush([adminUser, sellerUser, viewerUser, testViewer, testSeller, testProfileViewer]);
  }
}

