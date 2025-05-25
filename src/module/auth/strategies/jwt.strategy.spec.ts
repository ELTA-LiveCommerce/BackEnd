import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { JwtStrategy } from './jwt.strategy';
import { TokenBlacklistService } from '../token-blacklist.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            isTokenBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get(UserService);
    tokenBlacklistService = module.get(TokenBlacklistService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as any;

    const mockPayload = {
      sub: 'user-id',
      email: 'test@example.com',
      role: 'VIEWER',
    };

    it('정상적인 사용자의 토큰을 검증해야 함', async () => {
      // 준비
      const mockUser = new User();
      mockUser.id = 'user-id';
      mockUser.name = 'Test User';
      mockUser.role = UserRole.VIEWER;

      tokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
      userService.findOne.mockResolvedValue(mockUser);

      // 실행
      const result = await strategy.validate(mockRequest, mockPayload);

      // 검증
      expect(tokenBlacklistService.isTokenBlacklisted).toHaveBeenCalledWith('valid-token');
      expect(userService.findOne).toHaveBeenCalledWith('user-id');
      expect(result).toBe(mockUser);
    });

    it('토큰이 없으면 UnauthorizedException을 발생시켜야 함', async () => {
      // 준비
      const requestWithoutToken = {
        headers: {},
      } as any;

      // 실행 및 검증
      await expect(strategy.validate(requestWithoutToken, mockPayload)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 토큰입니다.'),
      );
    });

    it('블랙리스트된 토큰은 거부해야 함', async () => {
      // 준비
      tokenBlacklistService.isTokenBlacklisted.mockResolvedValue(true);

      // 실행 및 검증
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        new UnauthorizedException('만료된 토큰입니다.'),
      );

      expect(tokenBlacklistService.isTokenBlacklisted).toHaveBeenCalledWith('valid-token');
    });

    it('소프트 삭제된 사용자는 인증할 수 없어야 함', async () => {
      // 소프트 삭제된 사용자는 findOne에서 NotFoundException이 발생 (또는 null 반환)
      tokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
      userService.findOne.mockRejectedValue(new Error('User with ID user-id not found'));

      // 실행 및 검증
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        new UnauthorizedException('사용자를 찾을 수 없습니다.'),
      );

      expect(userService.findOne).toHaveBeenCalledWith('user-id');
    });

    it('존재하지 않는 사용자는 인증할 수 없어야 함', async () => {
      // 준비
      tokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
      userService.findOne.mockRejectedValue(new Error('User with ID user-id not found'));

      // 실행 및 검증
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        new UnauthorizedException('사용자를 찾을 수 없습니다.'),
      );

      expect(userService.findOne).toHaveBeenCalledWith('user-id');
    });
  });
});

