import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { default as request } from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { AdminBroadcastController } from '@/api/v2/admin/broadcast/admin-broadcast.controller';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { UserService } from '@/module/user/user.service';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Stream } from '@/module/broadcast/entity/stream.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { AgoraService } from '@/module/agora/agora.service';
import { UserBlockService } from '@/module/user/user-block.service';

// Helper function to generate test JWT token
function generateTestToken(
  jwtService: JwtService,
  userId = 'test-admin-id',
  email = 'admin@test.com',
  role = UserRole.ADMIN,
): string {
  return jwtService.sign({
    sub: userId,
    email,
    role,
  });
}

describe('AdminBroadcastController (e2e) - updateMaxViewersCount', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testToken: string;

  // Mock repositories
  const mockBroadcastRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAll: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
  };

  const mockStreamRepository = {};

  const mockEntityManager = {
    persistAndFlush: jest.fn(),
  };

  const mockAgoraService = {
    getChannelUserCount: jest.fn(),
    getChatRoomMemberCount: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  const mockUserBlockService = {
    isUserBlockedBySeller: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminBroadcastController],
      providers: [
        BroadcastService,
        {
          provide: getRepositoryToken(Broadcast),
          useValue: mockBroadcastRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Stream),
          useValue: mockStreamRepository,
        },
        {
          provide: 'EntityManager',
          useValue: mockEntityManager,
        },
        {
          provide: AgoraService,
          useValue: mockAgoraService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: UserBlockService,
          useValue: mockUserBlockService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // JWT 서비스 설정
    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    testToken = generateTestToken(jwtService);

    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('PATCH /admin/broadcasts/:id/max-viewers', () => {
    const broadcastId = 'test-broadcast-id';
    const mockBroadcast = {
      id: broadcastId,
      title: 'Test Broadcast',
      maxViewers: 50,
    };

    it('should update max viewers count successfully', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: 100 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: '최대 시청자수가 성공적으로 설정되었습니다.',
        data: {
          broadcastId,
          maxViewers: 100,
        },
      });

      expect(mockBroadcastRepository.findOne).toHaveBeenCalledWith({ id: broadcastId });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
    });

    it('should update max viewers count to zero', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: 0 })
        .expect(200);

      expect(response.body.data.maxViewers).toBe(0);
    });

    it('should update max viewers count to maximum allowed value', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: 999999 })
        .expect(200);

      expect(response.body.data.maxViewers).toBe(999999);
    });

    it('should return 400 for negative max viewers', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: -1 })
        .expect(400);

      expect(response.body.message).toContain('maxViewers must be a positive number');
    });

    it('should return 400 for max viewers exceeding limit', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: 1000000 })
        .expect(400);

      expect(response.body.message).toContain('maxViewers must not be greater than 999999');
    });

    it('should return 400 for invalid max viewers type', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: 'invalid' })
        .expect(400);

      expect(response.body.message).toContain('maxViewers must be a number');
    });

    it('should return 400 for missing maxViewers field', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('maxViewers');
    });

    it('should return 404 when broadcast not found', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .patch(`/admin/broadcasts/non-existent-id/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: 100 })
        .expect(404);

      expect(response.body.message).toContain('방송 ID non-existent-id를 찾을 수 없습니다');
    });

    it('should return 401 without authorization token', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .send({ maxViewers: 100 })
        .expect(401);
    });

    it('should return 403 with non-admin user token', async () => {
      const viewerToken = generateTestToken(jwtService, 'viewer-id', 'viewer@test.com', UserRole.VIEWER);

      await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ maxViewers: 100 })
        .expect(403);
    });

    it('should handle database errors gracefully', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(mockBroadcast);
      mockEntityManager.persistAndFlush.mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .patch(`/admin/broadcasts/${broadcastId}/max-viewers`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ maxViewers: 100 })
        .expect(500);
    });
  });
});

