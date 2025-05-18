import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from '@/api/v2/admin/user/admin-user.controller';
import { UserService } from '@/module/user/user.service';
import { AdminUserSortBy, SortOrder } from '@/api/v2/admin/user/dto/admin-user-request.dto';

describe('AdminUserController - Sort', () => {
  let controller: AdminUserController;
  let userService: UserService;

  beforeEach(async () => {
    const mockUserService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should sort by name ASC', async () => {
      const mockResult = {
        users: [
          { id: '1', name: 'User A', phoneNumber: '01012345678' },
          { id: '2', name: 'User B', phoneNumber: '01098765432' },
        ],
        total: 2,
      };

      (userService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.getUsers({
        page: 1,
        limit: 10,
        sortBy: AdminUserSortBy.NAME,
        sortOrder: SortOrder.ASC,
      });

      expect(userService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: undefined,
        search: undefined,
        sortBy: AdminUserSortBy.NAME,
        sortOrder: SortOrder.ASC,
      });
    });

    it('should sort by phone number DESC', async () => {
      const mockResult = {
        users: [
          { id: '2', name: 'User B', phoneNumber: '01098765432' },
          { id: '1', name: 'User A', phoneNumber: '01012345678' },
        ],
        total: 2,
      };

      (userService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.getUsers({
        page: 1,
        limit: 10,
        sortBy: AdminUserSortBy.PHONE_NUMBER,
        sortOrder: SortOrder.DESC,
      });

      expect(userService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: undefined,
        search: undefined,
        sortBy: AdminUserSortBy.PHONE_NUMBER,
        sortOrder: SortOrder.DESC,
      });
    });

    it('should use default sorting when not specified', async () => {
      const mockResult = {
        users: [
          { id: '1', name: 'User A', phoneNumber: '01012345678' },
          { id: '2', name: 'User B', phoneNumber: '01098765432' },
        ],
        total: 2,
      };

      (userService.findAll as jest.Mock).mockResolvedValue(mockResult);

      await controller.getUsers({
        page: 1,
        limit: 10,
      });

      expect(userService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: undefined,
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });
  });
});

