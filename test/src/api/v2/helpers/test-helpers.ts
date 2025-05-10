import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/app.module';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * E2E 테스트 환경을 설정하는 유틸리티 함수
 */
export async function setupE2ETest(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // 실제 애플리케이션과 동일한 설정 적용
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return { app, moduleFixture };
}

/**
 * 테스트용 사용자를 생성하고 JWT 토큰을 발급하는 유틸리티 함수
 */
export async function createTestUserAndToken(
  moduleFixture: TestingModule,
  email: string,
  role: UserRole,
  name: string = '테스트 사용자',
): Promise<{ user: User; token: string }> {
  const userService = moduleFixture.get<UserService>(UserService);
  const jwtService = moduleFixture.get<JwtService>(JwtService);

  // 기존 사용자 확인 또는 새로 생성
  let user: User;
  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    user = existingUser;
  } else {
    user = await userService.create({
      email,
      password: 'password123',
      name,
      role,
    });
  }

  // JWT 토큰 생성
  const token = jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
}

/**
 * 테스트용 판매자를 생성하는 유틸리티 함수
 */
export async function createTestSeller(
  moduleFixture: TestingModule,
  email: string = 'test-seller@example.com',
  name: string = '테스트 판매자',
): Promise<User> {
  const { user } = await createTestUserAndToken(moduleFixture, email, UserRole.SELLER, name);
  return user;
}

/**
 * 테스트용 일반 사용자를 생성하는 유틸리티 함수
 */
export async function createTestViewer(
  moduleFixture: TestingModule,
  email: string = 'test-viewer@example.com',
  name: string = '테스트 뷰어',
): Promise<User> {
  const { user } = await createTestUserAndToken(moduleFixture, email, UserRole.VIEWER, name);
  return user;
}

/**
 * 테스트용 관리자를 생성하는 유틸리티 함수
 */
export async function createTestAdmin(
  moduleFixture: TestingModule,
  email: string = 'test-admin@example.com',
  name: string = '테스트 관리자',
): Promise<User> {
  const { user } = await createTestUserAndToken(moduleFixture, email, UserRole.ADMIN, name);
  return user;
}
