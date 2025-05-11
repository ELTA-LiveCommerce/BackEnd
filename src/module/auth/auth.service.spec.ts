import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { AuthService } from './auth.service';
import { KakaoUserDto } from './dto/kakao-auth.dto';
import { LoginProvider } from './entity/login.entity';
import { LoginService } from './login.service';
import { TokenBlacklistService } from './token-blacklist.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let loginService: LoginService;
  let jwtService: JwtService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    loginService = module.get<LoginService>(LoginService);
    jwtService = module.get<JwtService>(JwtService);

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
});
