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
            findByEmail: jest.fn(),
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
      mockUser.email = 'test@example.com';
      mockUser.name = 'TestUser';
      mockUser.role = UserRole.VIEWER;

      const mockLogin = {
        user: mockUser,
        provider: LoginProvider.KAKAO,
        providerId: '12345',
      };

      loginService.findByProviderId = jest.fn().mockResolvedValue(mockLogin);
      loginService.updateLoginInfo = jest.fn().mockResolvedValue(mockLogin);

      // 실행
      const result = await service.validateKakaoUser(kakaoUserDto);

      // 검증
      expect(loginService.findByProviderId).toHaveBeenCalledWith(LoginProvider.KAKAO, '12345');
      expect(loginService.updateLoginInfo).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'test-token');
      expect(result).toHaveProperty('id', 'user-id');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should find existing user by email if no login info found', async () => {
      // 준비
      const mockUser = new User();
      mockUser.id = 'user-id';
      mockUser.email = 'test@example.com';
      mockUser.name = 'TestUser';
      mockUser.role = UserRole.VIEWER;

      loginService.findByProviderId = jest.fn().mockResolvedValue(null);
      userService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      loginService.createLoginInfo = jest.fn();

      // 실행
      const result = await service.validateKakaoUser(kakaoUserDto);

      // 검증
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(loginService.createLoginInfo).toHaveBeenCalledWith(
        mockUser,
        LoginProvider.KAKAO,
        '12345',
        expect.objectContaining({
          email: 'test@example.com',
          nickname: 'TestUser',
          profileImage: 'profile.jpg',
        }),
      );
      expect(result).toHaveProperty('access_token', 'test-token');
    });

    it('should create new user if no user found', async () => {
      // 준비
      const mockUser = new User();
      mockUser.id = 'new-user-id';
      mockUser.email = 'test@example.com';
      mockUser.name = 'TestUser';
      mockUser.role = UserRole.VIEWER;

      loginService.findByProviderId = jest.fn().mockResolvedValue(null);
      userService.findByEmail = jest.fn().mockResolvedValue(null);
      userService.create = jest.fn().mockResolvedValue(mockUser);
      loginService.createLoginInfo = jest.fn();

      // 실행
      const result = await service.validateKakaoUser(kakaoUserDto);

      // 검증
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
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
      loginService.findByProviderId = jest.fn().mockRejectedValue(new Error('Test error'));

      // 실행 및 검증
      await expect(service.validateKakaoUser(kakaoUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should generate fallback email with kakaoId if email not provided', async () => {
      // 준비
      const noEmailKakaoUser = { ...kakaoUserDto, email: undefined };
      const mockUser = new User();
      mockUser.id = 'new-user-id';
      mockUser.role = UserRole.VIEWER;

      loginService.findByProviderId = jest.fn().mockResolvedValue(null);
      userService.findByEmail = jest.fn().mockResolvedValue(null);
      userService.create = jest.fn().mockResolvedValue(mockUser);
      loginService.createLoginInfo = jest.fn();

      // 실행
      await service.validateKakaoUser(noEmailKakaoUser);

      // 검증
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: `kakao_12345@example.com`,
        }),
      );
    });
  });
});
