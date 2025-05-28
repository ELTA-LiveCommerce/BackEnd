import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { JwtService } from '@nestjs/jwt';

import { BroadcastControllerModule } from '@/api/v2/viewer/live/broadcast-controller.module';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { AgoraService } from '@/module/agora/agora.service';
import { UserBlockService } from '@/module/user/user-block.service';

function generateTestToken(
  jwtService: JwtService,
  userId = 'test-user-id',
  email = 'test@example.com',
  role = UserRole.VIEWER,
): string {
  return jwtService.sign({
    sub: userId,
    email,
    role,
  });
}

describe('BroadcastController (e2e) - Viewer Live', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testToken: string;

  const mockBroadcastRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEntityManager = {
    findOne: jest.fn(),
    populate: jest.fn(),
  };

  const mockAgoraService = {
    rtcTokenWithAccount: jest.fn().mockReturnValue('mock-rtc-token'),
    chatUserToken: jest.fn().mockReturnValue('mock-chat-token'),
    addUser: jest.fn(),
    getChannelUserCount: jest.fn().mockReturnValue(5),
  };

  const mockUserBlockService = {
    isUserBlockedBySeller: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BroadcastControllerModule],
    })
      .overrideProvider(getRepositoryToken(Broadcast))
      .useValue(mockBroadcastRepository)
      .overrideProvider(SqlEntityManager)
      .useValue(mockEntityManager)
      .overrideProvider(AgoraService)
      .useValue(mockAgoraService)
      .overrideProvider(UserBlockService)
      .useValue(mockUserBlockService)
      .compile();

    app = module.createNestApplication();

    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    testToken = generateTestToken(jwtService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /v2/viewer/lives/:id (방송 상세 조회)', () => {
    const liveBroadcast = {
      id: 'live-broadcast-id',
      title: '라이브 방송',
      description: '라이브 방송 설명',
      isLive: true,
      seller: { id: 'seller-id', name: '판매자' },
      products: [],
      scheduledAt: new Date(),
      thumbnailUrl: 'http://example.com/thumbnail.jpg',
      maxViewers: 100,
      startLive: jest.fn(),
      endLive: jest.fn(),
      updateMaxViewers: jest.fn(),
    } as unknown as Broadcast;

    const endedBroadcast = {
      id: 'ended-broadcast-id',
      title: '종료된 방송',
      description: '종료된 방송 설명',
      isLive: false,
      seller: { id: 'seller-id', name: '판매자' },
      products: [],
      scheduledAt: new Date(),
      thumbnailUrl: 'http://example.com/thumbnail.jpg',
      maxViewers: 100,
      startLive: jest.fn(),
      endLive: jest.fn(),
      updateMaxViewers: jest.fn(),
    } as unknown as Broadcast;

    it('should return broadcast details when broadcast is live', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(liveBroadcast);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/lives/live-broadcast-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('live-broadcast-id');
      expect(response.body.message).toBe('방송 상세 조회 성공');
    });

    it('should return null when broadcast is ended (viewer cannot access)', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(endedBroadcast);

      const response = await request(app.getHttpServer())
        .get('/v2/viewer/lives/ended-broadcast-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toBe('종료된 방송입니다.');
    });

    it('should return 404 when broadcast not found', async () => {
      const notFoundError = new Error('방송을 찾을 수 없습니다: not-exist-id');
      notFoundError.name = 'NotFoundException';
      mockBroadcastRepository.findOne.mockRejectedValue(notFoundError);

      await request(app.getHttpServer())
        .get('/v2/viewer/lives/not-exist-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/v2/viewer/lives/live-broadcast-id').expect(401);
    });
  });

  describe('POST /v2/viewer/lives/join (방송 입장)', () => {
    const liveBroadcast = {
      id: 'live-broadcast-id',
      isLive: true,
      seller: { id: 'seller-id' },
      stream: {
        id: 'test-channel-id',
        chatRoomId: 'test-chat-room-id',
      },
      maxViewers: 10,
    };

    it('should successfully join live broadcast', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(liveBroadcast);

      const response = await request(app.getHttpServer())
        .post('/v2/viewer/lives/join')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ broadcastId: 'live-broadcast-id' })
        .expect(201);

      expect(response.body.broadcastId).toBe('live-broadcast-id');
      expect(response.body.channelId).toBe('test-channel-id');
      expect(response.body.rtcToken).toBe('mock-rtc-token');
      expect(response.body.chatToken).toBe('mock-chat-token');
    });

    it('should reject joining ended broadcast', async () => {
      const endedBroadcast = { ...liveBroadcast, isLive: false };
      mockBroadcastRepository.findOne.mockResolvedValue(endedBroadcast);

      await request(app.getHttpServer())
        .post('/v2/viewer/lives/join')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ broadcastId: 'ended-broadcast-id' })
        .expect(400);
    });

    it('should reject joining when blocked by seller', async () => {
      mockBroadcastRepository.findOne.mockResolvedValue(liveBroadcast);
      mockUserBlockService.isUserBlockedBySeller.mockResolvedValue(true);

      await request(app.getHttpServer())
        .post('/v2/viewer/lives/join')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ broadcastId: 'live-broadcast-id' })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/v2/viewer/lives/join')
        .send({ broadcastId: 'live-broadcast-id' })
        .expect(401);
    });
  });
});

