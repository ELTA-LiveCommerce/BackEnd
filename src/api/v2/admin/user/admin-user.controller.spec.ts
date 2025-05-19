import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from './admin-user.controller';
import { UserService } from '@/module/user/user.service';
import { UserModule } from '@/module/user/user.module';
import { AuthModule } from '@/module/auth/auth.module';
import { UserRole } from '@/shared/enum/user-role.enum';
import { AdminUserResponse, AdminUserListResponse } from './dto/admin-user-response.dto';
import { AdminUserListRequest, AdminCreateUserRequest, AdminUpdateUserRequest } from './dto/admin-user-request.dto';

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let userService: UserService;

  const mockUserService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    name: '홍길동',
    loginId: 'gildong',
    email: 'test@example.com',
    role: UserRole.VIEWER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<AdminUserController>(AdminUserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('사용자 목록을 반환해야 함', async () => {
      // Given
      const query: AdminUserListRequest = {
        page: 1,
        limit: 10,
        role: UserRole.VIEWER,
        search: 'test',
      };

      const users = [mockUser];
      const total = 1;

      mockUserService.findAll.mockResolvedValue({ users, total });

      // When
      const result = await controller.getUsers(query);

      // Then
      expect(userService.findAll).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        role: query.role,
        search: query.search,
      });
      expect(result).toHaveProperty('data');
      expect(result.data.total).toBe(total);
      expect(result.data.items.length).toBe(users.length);
    });
  });

  describe('getUser', () => {
    it('사용자 ID로 단일 사용자를 반환해야 함', async () => {
      // Given
      const userId = 'test-user-id';
      mockUserService.findOne.mockResolvedValue(mockUser);

      // When
      const result = await controller.getUser(userId);

      // Then
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('id', mockUser.id);
    });
  });

  describe('createUser', () => {
    it('사용자를 생성하고 반환해야 함', async () => {
      // Given
      const createUserDto: AdminCreateUserRequest = {
        name: '홍길동',
        email: 'test@example.com',
        password: 'password123',
        nickname: 'gildong',
        role: UserRole.VIEWER,
        phoneNumber: '01012345678',
      };

      mockUserService.create.mockResolvedValue(mockUser);

      // When
      const result = await controller.createUser(createUserDto);

      // Then
      expect(userService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('id', mockUser.id);
    });
  });

  describe('updateUser', () => {
    it('사용자 정보를 업데이트하고 반환해야 함', async () => {
      // Given
      const userId = 'test-user-id';
      const updateUserDto: AdminUpdateUserRequest = {
        name: '홍길동',
        email: 'updated@example.com',
      };

      const updatedUser = { ...mockUser, email: 'updated@example.com' };
      mockUserService.update.mockResolvedValue(updatedUser);

      // When
      const result = await controller.updateUser(userId, updateUserDto);

      // Then
      expect(userService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('email', updatedUser.email);
    });
  });

  describe('deleteUser', () => {
    it('사용자를 삭제해야 함', async () => {
      // Given
      const userId = 'test-user-id';
      mockUserService.remove.mockResolvedValue(undefined);

      // When
      await controller.deleteUser(userId);

      // Then
      expect(userService.remove).toHaveBeenCalledWith(userId);
    });
  });
});

