import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserControllerModule } from './admin-user-controller.module';
import { AdminUserController } from './admin-user.controller';
import { UserModule } from '@/module/user/user.module';
import { AuthModule } from '@/module/auth/auth.module';

jest.mock('@/module/user/user.module');
jest.mock('@/module/auth/auth.module');

describe('AdminUserControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdminUserControllerModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminUserController registered', () => {
    const controllers = module.get('__ControllerTokens__');
    expect(controllers).toContain(AdminUserController);
  });
});
