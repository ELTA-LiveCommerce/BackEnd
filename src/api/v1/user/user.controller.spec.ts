import { Collection } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Login } from '@/module/auth/entity/login.entity';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            updateBankInfo: jest.fn(),
            verifyUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        loginId: 'test@example.com',
        password: 'TestPass1!',
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        accountNumber: '123-456-789012',
        bankName: '신한은행',
      };

      const expectedUser = {
        id: '1',
        loginId: createUserDto.loginId,
        password: 'hashedpassword',
        name: createUserDto.name,
        phoneNumber: createUserDto.phoneNumber,
        accountNumber: createUserDto.accountNumber,
        bankName: createUserDto.bankName,
        role: UserRole.VIEWER,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        logins: new Collection<Login>({} as any),
      };

      jest.spyOn(service, 'create').mockResolvedValue(expectedUser as any);

      const result = await controller.create(createUserDto as any);
      expect(result).toBe(expectedUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const userId = '1';
      const expectedUser = {
        id: userId,
        loginId: 'test@example.com',
        name: '홍길동',
        password: 'hashedpassword',
        phoneNumber: '010-1234-5678',
        accountNumber: '123-456-789012',
        bankName: '신한은행',
        role: UserRole.VIEWER,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        logins: new Collection<Login>({} as any),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(expectedUser as any);

      const result = await controller.findOne(userId);
      expect(result).toBe(expectedUser);
      expect(service.findOne).toHaveBeenCalledWith(userId);
    });
  });
});
