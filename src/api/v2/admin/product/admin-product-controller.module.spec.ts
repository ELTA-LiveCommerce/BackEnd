import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductControllerModule } from './admin-product-controller.module';
import { AdminProductController } from './admin-product.controller';
import { ProductModule } from '@/module/product/product.module';
import { AuthModule } from '@/module/auth/auth.module';
import { UserModule } from '@/module/user/user.module';
import { ProductService } from '@/module/product/product.service';
import { UserService } from '@/module/user/user.service';

// 모듈 모킹 대신 직접 서비스를 모킹
describe('AdminProductControllerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockProductService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const mockUserService = {
      findOne: jest.fn().mockResolvedValue({}),
      findAll: jest.fn().mockResolvedValue([]),
    };

    module = await Test.createTestingModule({
      controllers: [AdminProductController],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AdminProductController registered', () => {
    const controller = module.get<AdminProductController>(AdminProductController);
    expect(controller).toBeDefined();
  });
});

