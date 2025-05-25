import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { AuthService } from './auth.service';
import { KakaoUserDto } from './dto/kakao-auth.dto';
import { LoginProvider } from './entity/login.entity';
import { LoginService } from './login.service';
import { TokenBlacklistService } from './token-blacklist.service';

// bcrypt 모킹 추가
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let loginService: LoginService;
  let jwtService: JwtService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByLoginId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: LoginService,
          useValue: {
            findByProviderId: jest.fn(),
            createLoginInfo: jest.fn(),
            updateLoginInfo: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            isTokenBlacklisted: jest.fn().mockResolvedValue(false),
            addToBlacklist: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'kakao.clientId') return 'test-kakao-client-id';
              if (key === 'kakao.callbackUrl') return 'test-kakao-callback-url';
              if (key === 'apple.clientId') return 'test-apple-client-id';
              if (key === 'apple.teamId') return 'test-apple-team-id';
              if (key === 'apple.keyId') return 'test-apple-key-id';
              if (key === 'apple.privateKey') return 'test-apple-private-key';
              if (key === 'jwt.secret') return 'test-jwt-secret';
              if (key === 'jwt.refreshSecret') return 'test-jwt-refresh-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    loginService = module.get<LoginService>(LoginService);
    jwtService = module.get<JwtService>(JwtService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateKakaoUser', () => {
    const kakaoUserDto: KakaoUserDto = {
      kakaoId: 12345,
      email: 'test@example.com',
      nickname: 'TestUser',
      profileImage: 'profile.jpg',
      thumbnailImage: 'thumbnail.jpg',
    };

    it('should return existing user from login info if found', async () => {
      // 준비
      const mockUser = new User();
      mockUser.id = 'user-id';
      mockUser.loginId = 'test@example.com';
      mockUser.name = 'TestUser';
      mockUser.role = UserRole.VIEWER;

      const mockLogin = {
        user: mockUser,
        provider: LoginProvider.KAKAO,
        providerId: '12345',
      };

      (loginService.findByProviderId as jest.Mock).mockResolvedValue(mockLogin);
      (loginService.updateLoginInfo as jest.Mock).mockResolvedValue(mockLogin);

      // 실행
      const result = await service.validateKakaoUser(kakaoUserDto);

      // 검증
      expect(loginService.findByProviderId).toHaveBeenCalledWith(LoginProvider.KAKAO, '12345');
      expect(loginService.updateLoginInfo).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'test-token');
      expect(result).toHaveProperty('id', 'user-id');
      expect(result).toHaveProperty('loginId', 'test@example.com');
    });

    it('should find existing user by loginId if no login info found', async () => {
      // 준비
      const mockUser = new User();
      mockUser.id = 'user-id';
      mockUser.loginId = 'test@example.com';
      mockUser.name = 'TestUser';
      mockUser.role = UserRole.VIEWER;

      (loginService.findByProviderId as jest.Mock).mockResolvedValue(null);
      (userService.findByLoginId as jest.Mock).mockResolvedValue(mockUser);
      (loginService.createLoginInfo as jest.Mock).mockResolvedValue({});

      // 실행
      const result = await service.validateKakaoUser(kakaoUserDto);

      // 검증
      expect(userService.findByLoginId).toHaveBeenCalledWith(kakaoUserDto.email);
      expect(loginService.createLoginInfo).toHaveBeenCalledWith(
        mockUser,
        LoginProvider.KAKAO,
        '12345',
        expect.objectContaining({
          loginId: kakaoUserDto.email,
          nickname: 'TestUser',
          profileImage: 'profile.jpg',
        }),
      );
      expect(result).toHaveProperty('access_token', 'test-token');
    });

    it('should create new user if no user found', async () => {
      // 준비
      const mockCreatedUser = new User();
      mockCreatedUser.id = 'new-user-id';
      mockCreatedUser.loginId = 'test@example.com';
      mockCreatedUser.name = 'TestUser';
      mockCreatedUser.role = UserRole.VIEWER;

      (loginService.findByProviderId as jest.Mock).mockResolvedValue(null);
      (userService.findByLoginId as jest.Mock).mockResolvedValue(null);
      (userService.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (loginService.createLoginInfo as jest.Mock).mockResolvedValue({});

      // 실행
      const result = await service.validateKakaoUser(kakaoUserDto);

      // 검증
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          loginId: kakaoUserDto.email,
          name: 'TestUser',
          role: UserRole.VIEWER,
        }),
      );
      expect(loginService.createLoginInfo).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'test-token');
      expect(result).toHaveProperty('id', 'new-user-id');
    });

    it('should handle validation error', async () => {
      // 준비
      (loginService.findByProviderId as jest.Mock).mockRejectedValue(new Error('Test error'));

      // 실행 및 검증
      await expect(service.validateKakaoUser(kakaoUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should generate fallback loginId with kakaoId if email not provided', async () => {
      // 준비
      const noEmailKakaoUser = { ...kakaoUserDto, email: undefined };
      const mockCreatedUser = new User();
      mockCreatedUser.id = 'new-user-id';
      mockCreatedUser.role = UserRole.VIEWER;

      (loginService.findByProviderId as jest.Mock).mockResolvedValue(null);
      (userService.findByLoginId as jest.Mock).mockResolvedValue(null);
      (userService.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (loginService.createLoginInfo as jest.Mock).mockResolvedValue({});

      // 실행
      await service.validateKakaoUser(noEmailKakaoUser);

      // 검증
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          loginId: `kakao_${noEmailKakaoUser.kakaoId}`,
        }),
      );
    });
  });

  describe('validateUser (password login)', () => {
    it('정상적인 사용자는 로그인할 수 있어야 함', async () => {
      // 준비
      const mockUser = new User();
      mockUser.id = 'user-id';
      mockUser.loginId = 'test@example.com';
      mockUser.name = 'TestUser';
      mockUser.role = UserRole.VIEWER;
      mockUser.password = 'hashed_password';

      (userService.findByLoginId as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // 실행
      const result = await service.validateUser('test@example.com', 'password123');

      // 검증
      expect(userService.findByLoginId).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result).toHaveProperty('access_token', 'test-token');
      expect(result.id).toBe('user-id');
    });

    it('소프트 삭제된 사용자는 로그인할 수 없어야 함', async () => {
      // 소프트 삭제된 사용자는 findByLoginId에서 null을 반환
      (userService.findByLoginId as jest.Mock).mockResolvedValue(null);

      // 실행 및 검증
      await expect(service.validateUser('deleted@example.com', 'password123')).rejects.toThrow(
        new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.'),
      );

      expect(userService.findByLoginId).toHaveBeenCalledWith('deleted@example.com');
    });

    it('존재하지 않는 사용자는 로그인할 수 없어야 함', async () => {
      (userService.findByLoginId as jest.Mock).mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.'),
      );
    });

    it('잘못된 비밀번호로는 로그인할 수 없어야 함', async () => {
      const mockUser = new User();
      mockUser.id = 'user-id';
      mockUser.loginId = 'test@example.com';
      mockUser.password = 'hashed_password';

      (userService.findByLoginId as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.'),
      );
    });
  });

  describe('loginV2', () => {
    it('소프트 삭제된 사용자는 V2 로그인할 수 없어야 함', async () => {
      // 소프트 삭제된 사용자는 findByLoginId에서 null을 반환
      (userService.findByLoginId as jest.Mock).mockResolvedValue(null);

      const loginRequest = {
        loginId: 'deleted@example.com',
        password: 'password123',
      };

      // 실행 및 검증
      await expect(service.loginV2(loginRequest)).rejects.toThrow(
        new UnauthorizedException('사용자 아이디 또는 비밀번호가 올바르지 않습니다.'),
      );

      expect(userService.findByLoginId).toHaveBeenCalledWith('deleted@example.com');
    });
  });

  describe('appLoginV2', () => {
    it('소프트 삭제된 사용자는 앱 로그인할 수 없어야 함', async () => {
      // 소프트 삭제된 사용자는 findByLoginId에서 null을 반환
      (userService.findByLoginId as jest.Mock).mockResolvedValue(null);

      const loginRequest = {
        loginId: 'deleted@example.com',
        password: 'password123',
        deviceId: 'test-device-id',
        appVersion: '1.0.0',
      };

      // 실행 및 검증
      await expect(service.appLoginV2(loginRequest)).rejects.toThrow(
        new UnauthorizedException('사용자 아이디 또는 비밀번호가 올바르지 않습니다.'),
      );

      expect(userService.findByLoginId).toHaveBeenCalledWith('deleted@example.com');
    });
  });
});

