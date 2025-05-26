import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../../user/user.service';
import { TokenBlacklistService } from '../token-blacklist.service';
import { User } from '../../user/entity/user.entity';
import { UserRole } from '../../../shared/enum/user-role.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: UserService;
  let tokenBlacklistService: TokenBlacklistService;

  const mockUser: User = {
    id: 'test-user-id',
    loginId: 'test@example.com',
    name: 'Test User',
    role: UserRole.VIEWER,
  } as User;

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
    userService = module.get<UserService>(UserService);
    tokenBlacklistService = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer test-token',
      },
    } as any;

    const mockPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'VIEWER',
    };

    it('should return user when token is valid and user exists', async () => {
      jest.spyOn(tokenBlacklistService, 'isTokenBlacklisted').mockResolvedValue(false);
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(tokenBlacklistService.isTokenBlacklisted).toHaveBeenCalledWith('test-token');
      expect(userService.findOne).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const requestWithoutToken = {
        headers: {},
      } as any;

      await expect(strategy.validate(requestWithoutToken, mockPayload)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 토큰입니다.'),
      );
    });

    it('should throw UnauthorizedException when token is blacklisted', async () => {
      jest.spyOn(tokenBlacklistService, 'isTokenBlacklisted').mockResolvedValue(true);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        new UnauthorizedException('만료된 토큰입니다.'),
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(tokenBlacklistService, 'isTokenBlacklisted').mockResolvedValue(false);
      jest.spyOn(userService, 'findOne').mockResolvedValue(null as any);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        new UnauthorizedException('사용자를 찾을 수 없습니다.'),
      );
    });
  });
});

