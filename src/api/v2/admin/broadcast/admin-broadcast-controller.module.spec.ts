import { Test, TestingModule } from '@nestjs/testing';
import { AdminBroadcastControllerModule } from './admin-broadcast-controller.module';
import { AdminBroadcastController } from './admin-broadcast.controller';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { UserService } from '@/module/user/user.service';

describe('AdminBroadcastControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // 서비스 모킹
    const mockBroadcastService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({}),
      findSellerBroadcastsPaged: jest.fn().mockResolvedValue({ data: { items: [], total: 0 } }),
    };

    const mockUserService = {
      findOne: jest.fn().mockResolvedValue({}),
    };

    module = await Test.createTestingModule({
      controllers: [AdminBroadcastController],
      providers: [
        { provide: BroadcastService, useValue: mockBroadcastService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminBroadcastController registered', () => {
    const controller = module.get<AdminBroadcastController>(AdminBroadcastController);
    expect(controller).toBeDefined();
  });
});
