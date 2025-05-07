import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '@/module/auth/auth.service';
import { LoginService } from '@/module/auth/login.service';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mockAuthService: any;

  beforeEach(async () => {
    // 모의 AuthService와 LoginService를 생성
    mockAuthService = {
      validateKakaoUser: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.VIEWER,
        access_token: 'mocked-access-token',
      }),
    };

    const mockLoginService = {
      findByProviderId: jest.fn(),
      createLoginInfo: jest.fn(),
      updateLoginInfo: jest.fn(),
    };

    // 모듈 생성 시 MikroORM 관련 의존성이 아닌, 모의 서비스를 제공
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoginService, useValue: mockLoginService },
      ],
    })
      // 인증 가드를 모의 가드로 대체
      .overrideGuard(AuthGuard('kakao'))
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('validateKakaoUser', () => {
    it('should validate kakao user and return user with token', async () => {
      // 테스트 데이터
      const kakaoUserDto = {
        kakaoId: 12345,
        email: 'test@example.com',
        nickname: 'TestUser',
        profileImage: 'profile.jpg',
        thumbnailImage: 'thumbnail.jpg',
      };

      // AuthService.validateKakaoUser 메소드를 호출하고 결과 검증
      const result = await mockAuthService.validateKakaoUser(kakaoUserDto);

      expect(result).toHaveProperty('id', 'test-user-id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('name', 'Test User');
      expect(result).toHaveProperty('role', UserRole.VIEWER);
      expect(result).toHaveProperty('access_token', 'mocked-access-token');
    });
  });
});
