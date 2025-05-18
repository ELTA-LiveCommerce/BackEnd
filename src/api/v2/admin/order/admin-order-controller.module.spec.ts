import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrderControllerModule } from './admin-order-controller.module';
import { AdminOrderController } from './admin-order.controller';
import { OrderModule } from '@/module/order/order.module';
import { AuthModule } from '@/module/auth/auth.module';

jest.mock('@/module/order/order.module');
jest.mock('@/module/auth/auth.module');

describe('AdminOrderControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdminOrderControllerModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminOrderController registered', () => {
    const controllers = module.get('__ControllerTokens__');
    expect(controllers).toContain(AdminOrderController);
  });
});
