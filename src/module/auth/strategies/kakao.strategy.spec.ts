import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '../auth.service';
import { KakaoStrategy } from './kakao.strategy';

describe('KakaoStrategy', () => {
  let strategy: KakaoStrategy;
  let authService: AuthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KakaoStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'KAKAO_CLIENT_ID') return 'test-client-id';
              if (key === 'KAKAO_CALLBACK_URL') return 'test-callback-url';
              return null;
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateKakaoUser: jest.fn().mockResolvedValue({
              id: 'user-id',
              email: 'test@example.com',
              name: 'TestUser',
              role: 'VIEWER',
              access_token: 'test-token',
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<KakaoStrategy>(KakaoStrategy);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate user with kakao profile', async () => {
      // 준비
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        _json: {
          id: 12345,
          properties: {
            nickname: 'TestUser',
            profile_image: 'profile.jpg',
            thumbnail_image: 'thumbnail.jpg',
          },
          kakao_account: {
            email: 'test@example.com',
          },
        },
      };
      const done = jest.fn();

      // 실행
      await strategy.validate(accessToken, refreshToken, profile as any, done);

      // 검증
      expect(authService.validateKakaoUser).toHaveBeenCalledWith({
        kakaoId: 12345,
        email: 'test@example.com',
        nickname: 'TestUser',
        profileImage: 'profile.jpg',
        thumbnailImage: 'thumbnail.jpg',
      });
      expect(done).toHaveBeenCalledWith(null, {
        id: 'user-id',
        email: 'test@example.com',
        name: 'TestUser',
        role: 'VIEWER',
        access_token: 'test-token',
      });
    });

    it('should handle missing email in profile', async () => {
      // 준비
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        _json: {
          id: 12345,
          properties: {
            nickname: 'TestUser',
            profile_image: 'profile.jpg',
            thumbnail_image: 'thumbnail.jpg',
          },
          kakao_account: {},
        },
      };
      const done = jest.fn();

      // 실행
      await strategy.validate(accessToken, refreshToken, profile as any, done);

      // 검증
      expect(authService.validateKakaoUser).toHaveBeenCalledWith({
        kakaoId: 12345,
        email: undefined,
        nickname: 'TestUser',
        profileImage: 'profile.jpg',
        thumbnailImage: 'thumbnail.jpg',
      });
    });

    it('should handle errors during validation', async () => {
      // 준비
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        _json: {
          id: 12345,
          properties: {
            nickname: 'TestUser',
          },
          kakao_account: {},
        },
      };
      const done = jest.fn();
      const error = new Error('Test error');

      authService.validateKakaoUser = jest.fn().mockRejectedValue(error);

      // 실행
      await strategy.validate(accessToken, refreshToken, profile as any, done);

      // 검증
      expect(done).toHaveBeenCalledWith(error);
    });
  });
});
