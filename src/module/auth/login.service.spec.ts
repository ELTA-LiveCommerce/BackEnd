import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '@/module/user/entity/user.entity';

import { Login, LoginProvider } from './entity/login.entity';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;
  let mockLoginRepository: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockLoginRepository = {
      findOne: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: getRepositoryToken(Login),
          useValue: mockLoginRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByProviderId', () => {
    it('should find login by provider and providerId', async () => {
      // 준비
      const mockLogin = new Login();
      mockLogin.provider = LoginProvider.KAKAO;
      mockLogin.providerId = '12345';

      mockLoginRepository.findOne.mockResolvedValue(mockLogin);

      // 실행
      const result = await service.findByProviderId(LoginProvider.KAKAO, '12345');

      // 검증
      expect(mockLoginRepository.findOne).toHaveBeenCalledWith({
        provider: LoginProvider.KAKAO,
        providerId: '12345',
      });
      expect(result).toBe(mockLogin);
    });

    it('should return null if login not found', async () => {
      // 준비
      mockLoginRepository.findOne.mockResolvedValue(null);

      // 실행
      const result = await service.findByProviderId(LoginProvider.KAKAO, '12345');

      // 검증
      expect(result).toBeNull();
    });
  });

  describe('createLoginInfo', () => {
    it('should create new login info', async () => {
      // 준비
      const mockUser = new User();
      mockUser.id = 'user-id';

      const loginData = {
        email: 'test@example.com',
        nickname: 'TestUser',
        profileImage: 'profile.jpg',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      // 실행
      await service.createLoginInfo(mockUser, LoginProvider.KAKAO, '12345', loginData);

      // 검증
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
      const savedLogin = mockEntityManager.persistAndFlush.mock.calls[0][0];

      expect(savedLogin.user).toBe(mockUser);
      expect(savedLogin.provider).toBe(LoginProvider.KAKAO);
      expect(savedLogin.providerId).toBe('12345');
      expect(savedLogin.email).toBe(loginData.email);
      expect(savedLogin.nickname).toBe(loginData.nickname);
      expect(savedLogin.profileImage).toBe(loginData.profileImage);
      expect(savedLogin.accessToken).toBe(loginData.accessToken);
      expect(savedLogin.refreshToken).toBe(loginData.refreshToken);
      expect(savedLogin.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('updateLoginInfo', () => {
    it('should update existing login info', async () => {
      // 준비
      const mockLogin = new Login();
      mockLogin.provider = LoginProvider.KAKAO;
      mockLogin.providerId = '12345';

      const mockUser = new User();
      mockUser.id = 'user-id';
      mockLogin.user = mockUser;

      const updateData = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        nickname: 'NewNickname',
        profileImage: 'new-profile.jpg',
      };

      // 실행
      await service.updateLoginInfo(mockLogin, updateData);

      // 검증
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
      expect(mockLogin.accessToken).toBe(updateData.accessToken);
      expect(mockLogin.refreshToken).toBe(updateData.refreshToken);
      expect(mockLogin.nickname).toBe(updateData.nickname);
      expect(mockLogin.profileImage).toBe(updateData.profileImage);
      expect(mockLogin.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should update only specified fields', async () => {
      // 준비
      const mockLogin = new Login();
      mockLogin.provider = LoginProvider.KAKAO;
      mockLogin.providerId = '12345';
      mockLogin.nickname = 'OldNickname';
      mockLogin.profileImage = 'old-profile.jpg';

      const mockUser = new User();
      mockUser.id = 'user-id';
      mockLogin.user = mockUser;

      const updateData = {
        accessToken: 'new-access-token',
      };

      // 실행
      await service.updateLoginInfo(mockLogin, updateData);

      // 검증
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
      expect(mockLogin.accessToken).toBe(updateData.accessToken);
      expect(mockLogin.nickname).toBe('OldNickname');
      expect(mockLogin.profileImage).toBe('old-profile.jpg');
      expect(mockLogin.lastLoginAt).toBeInstanceOf(Date);
    });
  });
});
