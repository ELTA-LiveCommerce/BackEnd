import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from './entity/user.entity';
import { UserService } from './user.service';
import { UserRole } from '../../shared/enum/user-role.enum';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockUserRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test1@example.com',
          role: UserRole.VIEWER,
          name: '홍길동',
          password: 'hashedpassword',
          phoneNumber: '010-1234-5678',
          accountNumber: '123-456-789012',
          bankName: '신한은행',
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: false,
        },
        {
          id: '2',
          email: 'test2@example.com',
          role: UserRole.SELLER,
          name: '김판매',
          password: 'hashedpassword',
          phoneNumber: '010-9876-5432',
          accountNumber: '987-654-321098',
          bankName: '국민은행',
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: true,
        },
      ];
      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        name: '홍길동',
        password: 'hashedpassword',
        phoneNumber: '010-1234-5678',
        accountNumber: '123-456-789012',
        bankName: '신한은행',
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: '1' });
    });
  });
});
