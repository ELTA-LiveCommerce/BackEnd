import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../../../module/user/user.service';
import { JwtAuthGuard } from '../../../module/auth/guards/jwt-auth.guard';

// Mock UserService
const mockUserService = {
  withdrawUser: jest.fn(),
};

// Mock JwtAuthGuard
const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true), // Simulate successful authentication
};

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('withdraw', () => {
    it('should call userService.withdrawUser with correct userId and return NO_CONTENT', async () => {
      const mockReq = {
        user: { id: 'test-user-id' },
      };
      const expectedUserId = mockReq.user.id;

      mockUserService.withdrawUser.mockResolvedValueOnce(undefined);

      const result = await controller.withdraw(mockReq);

      expect(mockUserService.withdrawUser).toHaveBeenCalledWith(expectedUserId);
      expect(result).toBeUndefined();
    });
  });
});
