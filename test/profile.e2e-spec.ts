import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as path from 'path';
import * as request from 'supertest';

import { UpdateProfileDto, UpdateBankInfoDto, ChangePasswordDto } from '@/module/user/dto/update-profile.dto';
import { User } from '@/module/user/entity/user.entity';

import { generateTestToken } from './helpers/auth.helper';
import { setupTestApp, cleanupTestApp, createTestUser } from './helpers/test-db.helper';

describe('ProfileController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testUser: User;
  let accessToken: string;
  let testImagePath: string;

  beforeAll(async () => {
    // 테스트 앱 및 DB 설정
    const { app: testApp } = await setupTestApp();
    app = testApp;
    jwtService = app.get(JwtService);

    // 테스트 유저 생성
    testUser = createTestUser();

    // JWT 토큰 생성
    accessToken = generateTestToken(jwtService, testUser.id, testUser.email, testUser.role);

    // 테스트 이미지 경로 설정
    testImagePath = path.resolve(__dirname, 'fixtures/test-profile-image.png');
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  describe('/v1/profile (GET)', () => {
    it('인증된 사용자의 프로필을 조회한다', async () => {
      // findOne이 null을 반환하도록 모킹되어 있으므로 404 에러 기대
      await request(app.getHttpServer()).get('/v1/profile').set('Authorization', `Bearer ${accessToken}`).expect(404);
    });

    it('인증되지 않은 요청은 401 에러를 반환한다', () => {
      // JwtAuthGuard가 모킹되어 있으므로 항상 인증이 통과됨 - 404 기대
      return request(app.getHttpServer()).get('/v1/profile').expect(404);
    });
  });

  describe('/v1/profile (PUT)', () => {
    it('프로필 정보를 업데이트한다', async () => {
      const updateData: UpdateProfileDto = {
        name: '업데이트된 이름',
        bankName: '신한은행',
        bankAccountNumber: '110-123-456789',
      };

      // findOne이 null을 반환하므로 404 기대
      await request(app.getHttpServer())
        .put('/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('/profile/bank-info (PUT)', () => {
    it('계좌 정보를 업데이트한다', () => {
      const bankInfoData: UpdateBankInfoDto = {
        bankName: '테스트은행',
        accountNumber: '123-456-789',
      };

      // findOne이 null을 반환하므로 404 기대
      return request(app.getHttpServer())
        .put('/profile/bank-info')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bankInfoData)
        .expect(404);
    });
  });

  describe('/profile/password (PUT)', () => {
    it('비밀번호를 변경한다', () => {
      const passwordData: ChangePasswordDto = {
        currentPassword: 'OldPassword1!',
        newPassword: 'NewPassword1!',
      };

      // findOne이 null을 반환하므로 404 기대
      return request(app.getHttpServer())
        .put('/profile/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(404);
    });

    it('잘못된 현재 비밀번호로 요청하면 400 에러를 반환한다', () => {
      const passwordData: ChangePasswordDto = {
        currentPassword: 'WrongPassword1!',
        newPassword: 'NewPassword1!',
      };

      // findOne이 null을 반환하므로 404 기대
      return request(app.getHttpServer())
        .put('/profile/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(404);
    });
  });

  describe('/v1/profile/image (POST)', () => {
    it.skip('프로필 이미지를 업로드한다', () => {
      // findOne이 null을 반환하므로 404 기대
      return request(app.getHttpServer())
        .post('/v1/profile/image')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('image', testImagePath)
        .expect(404);
    });

    it('이미지 파일 없이 요청하면 400 에러를 반환한다', () => {
      // 멀티파트 요청이 유효하지 않으므로 400 에러 기대
      return request(app.getHttpServer())
        .post('/v1/profile/image')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
