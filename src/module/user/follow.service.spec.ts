import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';

import { Follow } from '@/module/user/entity/follow.entity';
import { User } from '@/module/user/entity/user.entity';
import { FollowService } from '@/module/user/follow.service';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('FollowService', () => {
  let service: FollowService;
  let mockFollowRepository: any;
  let mockUserRepository: any;
  let mockEntityManager: any;

  const mockUsers = [
    {
      id: 'user-id-1',
      name: '사용자1',
      email: 'user1@example.com',
      profileImage: null,
      role: UserRole.VIEWER,
    },
    {
      id: 'user-id-2',
      name: '판매자1',
      email: 'seller1@example.com',
      profileImage: null,
      role: UserRole.SELLER,
    },
    {
      id: 'user-id-3',
      name: '판매자2',
      email: 'seller2@example.com',
      profileImage: null,
      role: UserRole.SELLER,
    },
  ];

  const mockFollows = [
    {
      id: 'follow-id-1',
      follower: mockUsers[0],
      following: mockUsers[1],
    },
  ];

  beforeEach(async () => {
    mockFollowRepository = {
      findOne: jest.fn().mockImplementation((criteria) => {
        if (criteria?.follower?.id === 'user-id-1' && criteria?.following?.id === 'user-id-2') {
          return Promise.resolve(mockFollows[0]);
        }
        return Promise.resolve(null);
      }),
      find: jest.fn().mockImplementation((criteria) => {
        if (criteria?.follower?.id === 'user-id-1') {
          return Promise.resolve([mockFollows[0]]);
        }
        if (criteria?.following?.id === 'user-id-2') {
          return Promise.resolve([mockFollows[0]]);
        }
        return Promise.resolve([]);
      }),
    };

    mockUserRepository = {
      findOne: jest.fn().mockImplementation((criteria) => {
        const user = mockUsers.find((u) => u.id === criteria.id);
        return Promise.resolve(user || null);
      }),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        {
          provide: getRepositoryToken(Follow),
          useValue: mockFollowRepository,
        },
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

    service = module.get<FollowService>(FollowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('followUser', () => {
    it('should follow a user successfully', async () => {
      mockFollowRepository.findOne.mockResolvedValueOnce(null);
      mockEntityManager.persistAndFlush.mockImplementationOnce((follow) => {
        follow.id = 'new-follow-id';
        return Promise.resolve(follow);
      });

      const result = await service.followUser('user-id-1', 'user-id-3');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: 'user-id-3' });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: 'user-id-1' });
      expect(mockFollowRepository.findOne).toHaveBeenCalled();
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('new-follow-id');
    });

    it('should throw if trying to follow self', async () => {
      await expect(service.followUser('user-id-1', 'user-id-1')).rejects.toThrow();
    });

    it('should throw if already following', async () => {
      await expect(service.followUser('user-id-1', 'user-id-2')).rejects.toThrow();
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow a user successfully', async () => {
      await service.unfollowUser('user-id-1', 'user-id-2');

      expect(mockFollowRepository.findOne).toHaveBeenCalled();
      expect(mockEntityManager.removeAndFlush).toHaveBeenCalled();
    });

    it('should throw if not following', async () => {
      mockFollowRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.unfollowUser('user-id-1', 'user-id-3')).rejects.toThrow();
    });
  });

  describe('isFollowing', () => {
    it('should return true if following', async () => {
      const result = await service.isFollowing('user-id-1', 'user-id-2');
      expect(result).toBe(true);
    });

    it('should return false if not following', async () => {
      const result = await service.isFollowing('user-id-1', 'user-id-3');
      expect(result).toBe(false);
    });
  });

  describe('getFollowing', () => {
    it('should return following list', async () => {
      const result = await service.getFollowing('user-id-1');

      expect(mockFollowRepository.find).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockFollows[0].following.id);
    });
  });

  describe('getFollowers', () => {
    it('should return followers list', async () => {
      const result = await service.getFollowers('user-id-2');

      expect(mockFollowRepository.find).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockFollows[0].follower.id);
    });
  });
});
