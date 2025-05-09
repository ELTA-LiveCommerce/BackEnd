import { Collection } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { UserController } from '@/api/user/user.controller';
import { Login } from '@/module/auth/entity/login.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const mockUserService = {
      create: jest.fn(),
      findOne: jest.fn(),
      updateBankInfo: jest.fn(),
      verifyUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'TestPass1!',
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        accountNumber: '123-456-789012',
        bankName: '신한은행',
      };

      const expectedUser = {
        id: '1',
        ...createUserDto,
        password: 'hashedpassword',
        role: UserRole.VIEWER,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        logins: new Collection<Login>({}),
      };

      jest.spyOn(userService, 'create').mockResolvedValue(expectedUser as any);

      const result = await controller.create(createUserDto);
      expect(result).toBe(expectedUser);
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const userId = '1';
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: '홍길동',
        password: 'hashedpassword',
        phoneNumber: '010-1234-5678',
        accountNumber: '123-456-789012',
        bankName: '신한은행',
        role: UserRole.VIEWER,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        logins: new Collection<Login>({}),
      };

      jest.spyOn(userService, 'findOne').mockResolvedValue(expectedUser as any);

      const result = await controller.findOne(userId);
      expect(result).toBe(expectedUser);
      expect(userService.findOne).toHaveBeenCalledWith(userId);
    });
  });
});
