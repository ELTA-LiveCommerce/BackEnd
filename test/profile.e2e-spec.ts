import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

import { AppModule } from '@/app.module';
import { ChangePasswordDto, UpdateBankInfoDto, UpdateProfileDto } from '@/module/user/dto/update-profile.dto';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';
import { createUserFactory } from '@/test/factories';

import { generateTestToken } from './helpers/auth.helper';

describe('ProfileController (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let jwtService: JwtService;
  let testUser: any;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userService = moduleFixture.get<UserService>(UserService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // 테스트 사용자 생성
    const mockUser = createUserFactory({
      email: `test-${uuidv4()}@example.com`,
      name: '테스트 사용자',
      role: UserRole.VIEWER,
    });

    testUser = await userService.create({
      email: mockUser.email,
      password: 'TestPass1!',
      name: mockUser.name,
      role: mockUser.role,
      phoneNumber: '010-1234-5678',
    });

    // 테스트 토큰 생성
    accessToken = generateTestToken(jwtService, testUser.id, testUser.email, testUser.role);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/profile (GET)', () => {
    it('인증된 사용자의 프로필을 조회한다', () => {
      return request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUser.id);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
        });
    });

    it('인증되지 않은 요청은 401 에러를 반환한다', () => {
      return request(app.getHttpServer()).get('/profile').expect(401);
    });
  });

  describe('/profile (PUT)', () => {
    it('프로필 정보를 업데이트한다', () => {
      const updateData: UpdateProfileDto = {
        name: '업데이트된 이름',
        phoneNumber: '010-9876-5432',
      };

      return request(app.getHttpServer())
        .put('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', updateData.name);
          expect(res.body).toHaveProperty('phoneNumber', updateData.phoneNumber);
        });
    });
  });

  describe('/profile/bank-info (PUT)', () => {
    it('계좌 정보를 업데이트한다', () => {
      const bankInfoData: UpdateBankInfoDto = {
        accountNumber: '987-654-321098',
        bankName: '국민은행',
      };

      return request(app.getHttpServer())
        .put('/profile/bank-info')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bankInfoData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accountNumber', bankInfoData.accountNumber);
          expect(res.body).toHaveProperty('bankName', bankInfoData.bankName);
        });
    });
  });

  describe('/profile/password (PUT)', () => {
    it('비밀번호를 변경한다', () => {
      const passwordData: ChangePasswordDto = {
        currentPassword: 'TestPass1!',
        newPassword: 'NewPass1!',
      };

      return request(app.getHttpServer())
        .put('/profile/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('잘못된 현재 비밀번호로 요청하면 400 에러를 반환한다', () => {
      const passwordData = {
        currentPassword: 'WrongPass1!',
        newPassword: 'NewPass1!',
      };

      return request(app.getHttpServer())
        .put('/profile/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(passwordData)
        .expect(400);
    });
  });

  describe('/profile/image (POST)', () => {
    // 테스트용 이미지 파일 경로
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');

    // 테스트 이미지 파일 준비
    beforeAll(() => {
      // fixtures 디렉토리가 없으면 생성
      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      // 테스트 이미지 파일이 없으면 생성
      if (!fs.existsSync(testImagePath)) {
        // 간단한 이미지 파일 생성 (실제 이미지 대신 더미 파일)
        fs.writeFileSync(testImagePath, Buffer.from('test image content'));
      }
    });

    // 테스트 후 이미지 파일 정리
    afterAll(() => {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });

    it('프로필 이미지를 업로드한다', () => {
      return request(app.getHttpServer())
        .post('/profile/image')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('image', testImagePath)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('imageUrl');
          expect(res.body.imageUrl).toContain('/uploads/profiles/');
        });
    });

    it('이미지 파일 없이 요청하면 400 에러를 반환한다', () => {
      return request(app.getHttpServer())
        .post('/profile/image')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
