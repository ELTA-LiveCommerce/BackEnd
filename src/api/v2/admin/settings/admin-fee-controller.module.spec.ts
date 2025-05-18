import { Test, TestingModule } from '@nestjs/testing';
import { AdminFeeControllerModule } from './admin-fee-controller.module';
import { AdminFeeController } from './admin-fee.controller';
import { UserService } from '@/module/user/user.service';

describe('AdminFeeControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // 서비스 모킹
    const mockUserService = {
      findAll: jest.fn().mockResolvedValue({ users: [], total: 0 }),
      findOne: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };

    module = await Test.createTestingModule({
      controllers: [AdminFeeController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminFeeController registered', () => {
    const controller = module.get<AdminFeeController>(AdminFeeController);
    expect(controller).toBeDefined();
  });
});
