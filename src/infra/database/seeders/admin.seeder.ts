import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcrypt';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * 관리자(Admin) 계정을 생성하는 시더
 * 프로덕션 환경에서도 안전하게 사용할 수 있도록 설계됨
 */
export class AdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const adminLoginId = process.env.ADMIN_LOGIN_ID || 'admin@elta.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'EltaAdmin123!@#';
    const adminName = process.env.ADMIN_NAME || 'ELTA 관리자';

    // 이미 admin 계정이 존재하는지 확인
    const existingAdmin = await em.findOne(User, {
      loginId: adminLoginId,
      role: UserRole.ADMIN,
    });

    if (existingAdmin) {
      console.log(`Admin 계정이 이미 존재합니다: ${adminLoginId}`);
      return;
    }

    // 비밀번호 해싱
    const saltRounds = 12; // 프로덕션 환경에서는 더 높은 salt rounds 사용
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Admin 계정 생성
    const adminUser = em.create(User, {
      id: v4(),
      loginId: adminLoginId,
      password: hashedPassword,
      name: adminName,
      role: UserRole.ADMIN,
      isVerified: true,
      feePercentage: 0, // 관리자는 수수료 0%
      createdAt: new Date(),
      updatedAt: new Date(),
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
    });

    await em.persistAndFlush(adminUser);

    console.log(`Admin 계정이 성공적으로 생성되었습니다:`);
    console.log(`- Login ID: ${adminLoginId}`);
    console.log(`- Name: ${adminName}`);
    console.log(`- Role: ${UserRole.ADMIN}`);

    // 보안상 비밀번호는 로그에 출력하지 않음
    if (process.env.NODE_ENV !== 'production') {
      console.log(`- Password: ${adminPassword} (개발 환경에서만 표시)`);
    }
  }
}

