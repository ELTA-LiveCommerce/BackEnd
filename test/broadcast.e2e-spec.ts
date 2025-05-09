import { EntityManager } from '@mikro-orm/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

import { CreateBroadcastDto } from '@/module/broadcast/dto/create-broadcast.dto';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

import { generateTestToken } from './helpers/auth.helper';
import { setupTestApp, cleanupTestApp } from './helpers/test-db.helper';

describe('BroadcastController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let sellerToken: string;
  let testSeller: User;
  let entityManager: EntityManager;

  beforeAll(async () => {
    // 테스트 앱 설정
    const { app: testApp, em } = await setupTestApp();
    app = testApp;
    app.useGlobalPipes(new ValidationPipe());

    jwtService = app.get(JwtService);
    entityManager = em;

    // 테스트용 판매자 생성
    testSeller = new User();
    testSeller.name = 'E2E Broadcast Seller';
    testSeller.email = 'e2e-broadcast-seller@example.com';
    testSeller.role = UserRole.SELLER;
    testSeller.password = 'testpassword';
    testSeller.isVerified = true;

    await entityManager.persistAndFlush(testSeller);

    sellerToken = generateTestToken(jwtService, testSeller.id, testSeller.email, testSeller.role);
  });

  afterAll(async () => {
    if (testSeller && testSeller.id) {
      const sellerToDelete = await entityManager.findOne(User, { id: testSeller.id });
      if (sellerToDelete) {
        const broadcasts = await entityManager.find(Broadcast, { seller: sellerToDelete });
        for (const b of broadcasts) {
          await entityManager.removeAndFlush(b);
        }
        await entityManager.removeAndFlush(sellerToDelete);
      }
    }
    await cleanupTestApp(app);
  });

  describe('POST /broadcasts', () => {
    it('should create a new broadcast for a seller', async () => {
      const createDto: CreateBroadcastDto = {
        title: 'E2E Test Broadcast',
        description: 'This is a test broadcast created via E2E test.',
        isLive: false,
      };

      // DB에서 testSeller를 다시 조회하여 최신 상태를 가져옴
      const currentSeller = await entityManager.findOne(User, { email: testSeller.email });
      expect(currentSeller).toBeDefined();
      if (!currentSeller) return;

      return request(app.getHttpServer())
        .post('/broadcasts')
        .set(
          'Authorization',
          `Bearer ${generateTestToken(jwtService, currentSeller.id, currentSeller.email, currentSeller.role)}`,
        )
        .send(createDto)
        .expect(201)
        .then((response) => {
          const body = response.body as Broadcast;
          expect(body).toBeDefined();
          expect(body.title).toEqual(createDto.title);
          expect(body.description).toEqual(createDto.description);
          expect(body.isLive).toEqual(createDto.isLive);
          expect(body.streamKey).toBeDefined();
          expect(body.seller?.id).toEqual(currentSeller.id);
        });
    });

    it('should return 401 if no token is provided', () => {
      const createDto: CreateBroadcastDto = { title: 'Unauthorized Test' };
      return request(app.getHttpServer()).post('/broadcasts').send(createDto).expect(401);
    });

    // TODO: DTO 유효성 검사 실패 케이스 (예: title 누락)
    // TODO: 권한 없는 사용자(VIEWER 등)의 생성 시도 시 403 Forbidden 테스트
  });

  describe('GET /broadcasts', () => {
    it('should return a list of broadcasts', async () => {
      const createDto: CreateBroadcastDto = { title: 'Broadcast for GET test' };
      await request(app.getHttpServer())
        .post('/broadcasts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(createDto)
        .expect(201);

      return request(app.getHttpServer())
        .get('/broadcasts')
        .expect(200)
        .then((response) => {
          const body = response.body as Broadcast[];
          expect(body).toBeInstanceOf(Array);
          expect(body.length).toBeGreaterThanOrEqual(1);
          const found = body.find((b) => b.title === createDto.title);
          expect(found).toBeDefined();
        });
    });
  });

  describe('GET /broadcasts/:id', () => {
    let createdBroadcast: Broadcast;

    beforeAll(async () => {
      const createDto: CreateBroadcastDto = { title: 'Broadcast for GET by ID test' };
      const response = await request(app.getHttpServer())
        .post('/broadcasts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(createDto)
        .expect(201);
      createdBroadcast = response.body as Broadcast;
    });

    it('should return a single broadcast by id', () => {
      return request(app.getHttpServer())
        .get(`/broadcasts/${createdBroadcast.id}`)
        .expect(200)
        .then((response) => {
          const body = response.body as Broadcast;
          expect(body).toBeDefined();
          expect(body.id).toEqual(createdBroadcast.id);
          expect(body.title).toEqual(createdBroadcast.title);
        });
    });

    it('should return 404 if broadcast not found', () => {
      const nonExistentId = 'non-existent-uuid';
      return request(app.getHttpServer()).get(`/broadcasts/${nonExistentId}`).expect(404);
    });
  });

  // TODO: PUT /broadcasts/:id (Update)
  // TODO: DELETE /broadcasts/:id (Delete)
  // TODO: 방송 시작/종료 등 특수 기능에 대한 E2E 테스트
});
