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

      const loginData: {
        loginId?: string;
        nickname?: string;
        profileImage?: string;
        accessToken?: string;
        refreshToken?: string;
      } = {
        loginId: 'test@example.com',
        nickname: 'TestUser',
        profileImage: 'profile.jpg',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      const expectedLogin = new Login();
      Object.assign(expectedLogin, {
        user: mockUser,
        provider: LoginProvider.KAKAO,
        providerId: '12345',
        ...loginData,
        lastLoginAt: expect.any(Date), // lastLoginAt은 Date 타입이므로 expect.any(Date) 사용
      });
      // persistAndFlush가 호출될 때 반환될 Login 엔티티를 모킹합니다.
      // 실제로는 persistAndFlush가 void를 반환하므로, savedLogin을 가져오는 방식 수정이 필요합니다.
      // LoginService.createLoginInfo가 반환하는 값을 사용하거나,
      // EntityManager.persistAndFlush에 전달되는 인자를 확인합니다.

      mockEntityManager.persistAndFlush.mockImplementation((entity: Login) => {
        // 실제 DB 저장 로직 대신, 전달된 엔티티에 id 등을 할당하는 것처럼 모킹할 수 있습니다.
        // 이 테스트에서는 전달된 entity를 그대로 사용합니다.
        return Promise.resolve(entity);
      });

      // 실행
      const savedLogin = await service.createLoginInfo(mockUser, LoginProvider.KAKAO, '12345', loginData);

      // 검증
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(expect.any(Login));
      const persistCallArg = mockEntityManager.persistAndFlush.mock.calls[0][0];

      expect(persistCallArg.user).toBe(mockUser);
      expect(persistCallArg.provider).toBe(LoginProvider.KAKAO);
      expect(persistCallArg.providerId).toBe('12345');
      expect(persistCallArg.loginId).toBe(loginData.loginId);
      expect(persistCallArg.nickname).toBe(loginData.nickname);
      expect(persistCallArg.profileImage).toBe(loginData.profileImage);
      expect(persistCallArg.accessToken).toBe(loginData.accessToken);
      expect(persistCallArg.refreshToken).toBe(loginData.refreshToken);
      expect(persistCallArg.lastLoginAt).toBeInstanceOf(Date);

      // 서비스 메서드가 반환한 값도 확인
      expect(savedLogin.user).toBe(mockUser);
      expect(savedLogin.provider).toBe(LoginProvider.KAKAO);
      expect(savedLogin.providerId).toBe('12345');
      expect(savedLogin.loginId).toBe(loginData.loginId);
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
