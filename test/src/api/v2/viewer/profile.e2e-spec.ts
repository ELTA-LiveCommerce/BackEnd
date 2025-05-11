import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { UserRole } from '@/shared/enum/user-role.enum'; // 경로 수정: user.enum -> user-role.enum
import { User } from '@/module/user/entity/user.entity';
import { ProfileResponseDto } from '@/api/v2/viewer/profile/profile.dto'; // profile.dto로 변경
import { UserService } from '@/module/user/user.service';
import { ProfileControllerModule } from '@/api/v2/viewer/profile/profile-controller.module';
import { UserModule } from '@/module/user/user.module';
import { AuthModule } from '@/module/auth/auth.module';
import { HttpExceptionFilter } from '@/shared/filter/http-exception.filter';
import { UpdateProfileRequestDto } from '@/api/v2/viewer/profile/profile.dto'; // profile.dto에서 UpdateProfileRequestDto import

import { createE2ETestingModule, generateTestToken, mockViewer, mockAdmin } from '@test/helpers/e2e-test-utils';

jest.useRealTimers();

describe('Profile Controller (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userService: UserService;
  // SpyInstance 타입 명시 -> 제네릭 제거 또는 any로 변경
  let getProfileSpy: jest.SpyInstance; // 제네릭 제거
  let updateProfileSpy: jest.SpyInstance; // 제네릭 제거
  let updateBankInfoSpy: jest.SpyInstance; // 제네릭 제거

  let viewerToken: string;
  let unauthenticatedToken: string;
  let adminToken: string; // adminToken 선언은 되어있으나 e2e-test-utils에 mockAdmin 없음.

  beforeAll(async () => {
    const moduleFixture: any = await createE2ETestingModule({
      imports: [ProfileControllerModule, UserModule, AuthModule, ConfigModule.forRoot()],
    });

    app = moduleFixture.app;
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => new BadRequestException(errors),
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost)));

    await app.init();

    jwtService = moduleFixture.jwtService;
    userService = moduleFixture.userService;

    viewerToken = generateTestToken(jwtService, mockViewer.id, mockViewer.email, UserRole.VIEWER);
    unauthenticatedToken = generateTestToken(
      jwtService,
      'unauthenticated-test-user',
      'invalid@example.com',
      UserRole.VIEWER,
    );
    adminToken = generateTestToken(jwtService, 'admin-test-id', 'admin@example.com', UserRole.ADMIN);

    getProfileSpy = jest
      .spyOn(userService, 'findOne' as any)
      .mockImplementation(async (userId: string): Promise<User | undefined> => {
        if (userId === mockViewer.id) {
          return mockViewer as User;
        }
        return undefined;
      });

    updateProfileSpy = jest
      .spyOn(userService, 'updateProfile' as any)
      .mockImplementation(async (userId: string, dto: UpdateProfileRequestDto): Promise<User | undefined> => {
        if (userId === mockViewer.id) {
          const updatedProfile = { ...mockViewer } as User;
          if (dto.name) updatedProfile.name = dto.name;
          if (dto.phoneNumber) updatedProfile.phoneNumber = dto.phoneNumber;
          return updatedProfile;
        }
        return undefined;
      });

    updateBankInfoSpy = jest
      .spyOn(userService, 'updateBankInfo' as any)
      .mockImplementation(
        async (userId: string, dto: { bankName?: string; accountNumber?: string }): Promise<User | undefined> => {
          if (userId === mockViewer.id) {
            const updatedProfile = { ...mockViewer } as User;
            if (dto.bankName) updatedProfile.bankName = dto.bankName;
            if (dto.accountNumber) updatedProfile.accountNumber = dto.accountNumber;
            return updatedProfile;
          }
          return undefined;
        },
      );
  });

  afterAll(async () => {
    await app.close();
    // 스파이 클리어 또는 리셋 (필요시)
    getProfileSpy.mockClear();
    updateProfileSpy.mockClear();
    updateBankInfoSpy.mockClear();
  });

  describe('GET /v2/viewer/profile', () => {
    it('인증된 사용자는 프로필 정보를 조회할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/viewer/profile')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockViewer.id);
      expect(response.body.data.email).toBe(mockViewer.email);
      expect(getProfileSpy).toHaveBeenCalledWith(mockViewer.id);
    });

    it('인증되지 않은 사용자는 프로필을 조회할 수 없다 (401 Unauthorized)', async () => {
      await request(app.getHttpServer())
        .get('/v2/viewer/profile')
        .set('Authorization', `Bearer ${unauthenticatedToken}`)
        .expect(401);
    });

    it('Authorization 헤더 없이 요청하면 프로필을 조회할 수 없다 (401 Unauthorized)', async () => {
      await request(app.getHttpServer()).get('/v2/viewer/profile').expect(401);
    });
  });

  describe('PUT /v2/viewer/profile', () => {
    it('인증된 사용자는 프로필 정보를 수정할 수 있다', async () => {
      const updateDto: UpdateProfileRequestDto = {
        name: 'Updated Viewer Name',
        phoneNumber: '010-1234-5679',
      };
      const response = await request(app.getHttpServer())
        .put('/v2/viewer/profile')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateDto.name);
      expect(updateProfileSpy).toHaveBeenCalledWith(mockViewer.id, expect.objectContaining(updateDto));
    });

    it('인증된 사용자는 은행 정보를 수정할 수 있다', async () => {
      const updateBankDto = {
        bankName: 'Updated Bank',
        accountNumber: '9876543210',
      };
      const response = await request(app.getHttpServer())
        .put('/v2/viewer/profile/bank') // 경로 수정 필요 확인
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateBankDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bankName).toBe(updateBankDto.bankName);
      expect(updateBankInfoSpy).toHaveBeenCalledWith(mockViewer.id, updateBankDto);
    });

    it('인증되지 않은 사용자는 프로필을 수정할 수 없다 (401 Unauthorized)', async () => {
      const unauthUpdateDto: UpdateProfileRequestDto = { name: 'Unauthorized Update' };
      await request(app.getHttpServer())
        .put('/v2/viewer/profile')
        .set('Authorization', `Bearer ${unauthenticatedToken}`)
        .send(unauthUpdateDto)
        .expect(401);
    });

    it('잘못된 형식의 DTO로 요청하면 400 Bad Request 에러가 발생한다', async () => {
      const invalidDto = { unknownField: 'someValue' }; // 필수 필드가 없는 DTO 등
      await request(app.getHttpServer())
        .put('/v2/viewer/profile')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  // 배송지 관리 API 테스트 (ProfileController에 실제 로직이 없으므로 주석 유지)
  /*
  describe('배송지 관리 API', () => {
    // ... (기존 배송지 테스트 코드 주석 처리) ...
  });
  */

  // 은행 정보 수정 테스트는 PUT /v2/viewer/profile 테스트에 통합되었으므로 별도 테스트 불필요
  // describe('PUT /v2/viewer/profile/bank-info', () => { ... });
});
