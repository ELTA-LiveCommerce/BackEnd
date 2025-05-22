/**
 * E2E 테스트용 간소화된 사용자 시드 데이터
 */
import { EntityManager } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

// 테스트용 사용자 역할 열거형
export enum TestUserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  VIEWER = 'viewer',
}

// 테스트용 사용자 상태 열거형
export enum TestUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

// 테스트용 사용자 타입
export interface TestUser {
  id: string;
  loginId: string;
  password: string;
  name: string;
  role: TestUserRole;
  isVerified: boolean;
  status: TestUserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * E2E 테스트용 기본 사용자 데이터를 생성하는 함수
 */
export async function seedTestUsers(em: EntityManager): Promise<void> {
  const now = new Date();
  const usersData: TestUser[] = [
    {
      id: v4(),
      loginId: 'admin@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '관리자',
      role: TestUserRole.ADMIN,
      isVerified: true,
      status: TestUserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: v4(),
      loginId: 'seller@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '판매자',
      role: TestUserRole.SELLER,
      isVerified: true,
      status: TestUserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: v4(),
      loginId: 'viewer@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '일반 사용자',
      role: TestUserRole.VIEWER,
      isVerified: true,
      status: TestUserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: v4(),
      loginId: 'test-viewer@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '테스트 뷰어',
      role: TestUserRole.VIEWER,
      isVerified: true,
      status: TestUserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: v4(),
      loginId: 'test-seller@example.com',
      password: '$2b$10$ONyKj03pG1bhpmDWufp1uO3vqjGMQcB/d.9RiEBQsQvtCzKmD9UYa', // 'password123'
      name: '테스트 판매자',
      role: TestUserRole.SELLER,
      isVerified: true,
      status: TestUserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const userData of usersData) {
    // 테이블이 없으면 생성
    await em.getConnection().execute(`
      CREATE TABLE IF NOT EXISTS "user" (
        id UUID PRIMARY KEY,
        loginId VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
    `);

    // 사용자 데이터 삽입
    await em.getConnection().execute(`
      INSERT INTO "user" (id, loginId, password, name, role, "isVerified", status, "createdAt", "updatedAt")
      VALUES (
        '${userData.id}', 
        '${userData.loginId}', 
        '${userData.password}', 
        '${userData.name}', 
        '${userData.role}', 
        ${userData.isVerified}, 
        '${userData.status}', 
        '${userData.createdAt.toISOString()}', 
        '${userData.updatedAt.toISOString()}'
      )
      ON CONFLICT (loginId) DO UPDATE
      SET name = '${userData.name}', role = '${userData.role}', "updatedAt" = '${userData.updatedAt.toISOString()}';
    `);
  }
}

