import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserControllerModule } from './admin-user-controller.module';
import { AdminUserController } from './admin-user.controller';
import { UserService } from '@/module/user/user.service';

describe('AdminUserControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // 서비스 모킹
    const mockUserService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };

    module = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminUserController registered', () => {
    const controller = module.get<AdminUserController>(AdminUserController);
    expect(controller).toBeDefined();
  });
});

