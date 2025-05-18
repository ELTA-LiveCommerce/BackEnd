import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductControllerModule } from './admin-product-controller.module';
import { AdminProductController } from './admin-product.controller';
import { ProductModule } from '@/module/product/product.module';
import { AuthModule } from '@/module/auth/auth.module';

jest.mock('@/module/product/product.module');
jest.mock('@/module/auth/auth.module');

describe('AdminProductControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdminProductControllerModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminProductController registered', () => {
    const controllers = module.get('__ControllerTokens__');
    expect(controllers).toContain(AdminProductController);
  });
});
