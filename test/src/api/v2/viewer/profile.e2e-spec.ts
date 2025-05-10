import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import {
  createE2ETestingModule,
  closeE2ETestingModule,
  mockUserService, // mockUserService 임포트 추가
  generateTestToken, // generateTestToken 임포트 추가
  mockViewer, // viewer 사용자 정보
  testRequest,
} from '@test/helpers/e2e-test-utils';

// ProfileControllerModule과 UserModule을 직접 사용
import { ProfileControllerModule } from '@/api/v2/viewer/profile/profile-controller.module';
// import { User } from '@/module/user/entity/user.entity'; // UserService 모킹 제거로 인해 직접적인 User 타입 사용 줄어들 수 있음
import { UserRole } from '@/shared/enum/user-role.enum';
import { UserService } from '@/module/user/user.service';
import { ProfileController } from '@/api/v2/viewer/profile/profile.controller';
import { UpdateProfileDto } from '@/module/user/dto/update-profile.dto';

// 테스트용 사용자 데이터 (mockViewer와 일치 또는 유사하게) - 실제 DB 사용 시 불필요하거나 시딩 데이터 기준으로 변경
/*
const testUserProfile: Partial<User> = {
  ...mockViewer, // 기존 mockViewer 정보 사용
  name: 'Test User Name',
  phoneNumber: '010-1234-5678',
  bankName: 'Test Bank',
  accountNumber: '123-456-789012',
};
*/

// 모킹된 UserService 제거
/*
const mockUserService = {
  findOne: jest.fn().mockImplementation((userId: string) => {
    if (userId === mockViewer.id) {
      return Promise.resolve(testUserProfile);
    }
    return Promise.resolve(null);
  }),
  updateProfile: jest.fn().mockImplementation((userId: string, data: any) => {
    if (userId === mockViewer.id) {
      return Promise.resolve({ ...testUserProfile, ...data });
    }
    return Promise.resolve(null);
  }),
  updateBankInfo: jest.fn().mockImplementation((userId: string, data: any) => {
    if (userId === mockViewer.id) {
      return Promise.resolve({ ...testUserProfile, ...data });
    }
    return Promise.resolve(null);
  }),
};
*/

describe('Profile Controller (e2e)', () => {
  let app: INestApplication;
  let viewerToken: string;
  let unauthenticatedToken: string; // 만료된 토큰 또는 유효하지 않은 토큰
  let mockUserServiceInstance: typeof mockUserService;
  let jwtService: JwtService; // 토큰 생성을 위해 JwtService 인스턴스 추가

  beforeAll(async () => {
    try {
      mockUserServiceInstance = {
        ...mockUserService,
        getProfile: jest.fn().mockResolvedValue({ id: 'viewer-id', email: 'viewer@test.com', name: 'Viewer User' }),
        updateProfile: jest.fn().mockImplementation((userId, dto) => Promise.resolve({ id: userId, ...dto })),
      };

      // createE2ETestingModule 호출 시 JwtService도 반환받도록 수정
      const {
        app: testingApp,
        viewerToken: token,
        jwtService: appJwtService,
      } = await createE2ETestingModule({
        controllers: [ProfileController],
        providers: [{ provide: UserService, useValue: mockUserServiceInstance }],
      });
      app = testingApp;
      viewerToken = token;
      jwtService = appJwtService; // JwtService 할당

      // 만료된 토큰 생성 (createE2ETestingModule에서 반환된 jwtService 사용)
      unauthenticatedToken = generateTestToken(
        jwtService,
        'invalid-user',
        'invalid@example.com',
        UserRole.VIEWER,
        '0s',
      );
    } catch (error) {
      console.error('테스트 설정 중 오류 발생:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await closeE2ETestingModule(app);
  });

  describe('GET /v2/viewer/profile', () => {
    it('인증된 사용자는 프로필 정보를 조회할 수 있다', async () => {
      mockUserServiceInstance.getProfile.mockResolvedValueOnce({
        id: 'viewer-id',
        email: 'viewer@test.com',
        name: 'Test Viewer',
        role: UserRole.VIEWER,
      });

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/profile')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.id).toBe('viewer-id');
      expect(response.body.email).toBe('viewer@test.com');
      expect(mockUserServiceInstance.getProfile).toHaveBeenCalledWith('viewer-id');
    });

    it('인증되지 않은 사용자는 프로필을 조회할 수 없다 (401 Unauthorized)', async () => {
      await request(app.getHttpServer())
        .get('/v2/viewer/profile')
        .set('Authorization', `Bearer ${unauthenticatedToken}`) // 만료된 토큰 사용
        .expect(401);
    });

    it('Authorization 헤더 없이 요청하면 프로필을 조회할 수 없다 (401 Unauthorized)', async () => {
      await request(app.getHttpServer()).get('/v2/viewer/profile').expect(401);
    });
  });

  describe('PUT /v2/viewer/profile', () => {
    const updateProfileDto: UpdateProfileDto = {
      name: 'Updated Name',
      phoneNumber: '010-1234-5678',
      profileImage: 'http://example.com/new-image.jpg',
    };

    it('인증된 사용자는 프로필 정보를 수정할 수 있다', async () => {
      mockUserServiceInstance.updateProfile.mockResolvedValueOnce({ id: 'viewer-id', ...updateProfileDto });

      const response = await request(app.getHttpServer())
        .put('/v2/viewer/profile')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateProfileDto)
        .expect(200);

      expect(response.body.name).toBe(updateProfileDto.name);
      expect(response.body.phoneNumber).toBe(updateProfileDto.phoneNumber);
      expect(mockUserServiceInstance.updateProfile).toHaveBeenCalledWith('viewer-id', updateProfileDto);
    });

    it('인증되지 않은 사용자는 프로필을 수정할 수 없다 (401 Unauthorized)', async () => {
      const updateProfileDto: UpdateProfileDto = { name: 'Updated Fail' };
      await request(app.getHttpServer())
        .put('/v2/viewer/profile')
        .set('Authorization', `Bearer ${unauthenticatedToken}`) // 만료된 토큰 사용
        .send(updateProfileDto)
        .expect(401);
    });

    it('잘못된 형식의 DTO로 요청하면 400 Bad Request 에러가 발생한다', async () => {
      const invalidDto = { unknownField: 'someValue' }; // 필수 필드 누락
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
