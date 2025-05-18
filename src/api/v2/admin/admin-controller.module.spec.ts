import { Test, TestingModule } from '@nestjs/testing';
import { AdminControllerModule } from './admin-controller.module';
import { AdminUserControllerModule } from './user/admin-user-controller.module';
import { AdminProductControllerModule } from './product/admin-product-controller.module';
import { AdminOrderControllerModule } from './order/admin-order-controller.module';

jest.mock('./user/admin-user-controller.module');
jest.mock('./product/admin-product-controller.module');
jest.mock('./order/admin-order-controller.module');

describe('AdminControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdminControllerModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminControllerModule defined', () => {
    const adminControllerModule = module.get(AdminControllerModule);
    expect(adminControllerModule).toBeDefined();
  });
});

