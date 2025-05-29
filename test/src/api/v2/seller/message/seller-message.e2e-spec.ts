import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EntityManager } from '@mikro-orm/core';

import { AppModule } from '@/app.module';
import { User } from '@/module/user/entity/user.entity';
import { Conversation } from '@/module/message/entity/conversation.entity';
import { Message } from '@/module/message/entity/message.entity';
import { MessageService } from '@/module/message/message.service';
import { UserService } from '@/module/user/user.service';
import { AuthService } from '@/module/auth/auth.service';
import { UserRole } from '@/shared/enum/user-role.enum';
import { createTestUser, loginTestUser } from '../../../../helpers/auth.helper';

describe('/v2/seller/messages (e2e)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let messageService: MessageService;
  let userService: UserService;
  let authService: AuthService;
  let seller: User;
  let viewer1: User;
  let viewer2: User;
  let sellerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    em = moduleFixture.get(EntityManager);
    messageService = moduleFixture.get(MessageService);
    userService = moduleFixture.get(UserService);
    authService = moduleFixture.get(AuthService);
  });

  beforeEach(async () => {
    await em.nativeDelete(Message, {});
    await em.nativeDelete(Conversation, {});
    await em.nativeDelete(User, {});

    // 테스트 사용자 생성
    seller = await createTestUser(em, {
      loginId: 'seller1',
      password: 'password123',
      name: '판매자1',
      phoneNumber: '010-1111-1111',
      role: UserRole.SELLER,
    });

    viewer1 = await createTestUser(em, {
      loginId: 'viewer1',
      password: 'password123',
      name: '구매자1',
      phoneNumber: '010-2222-2222',
      role: UserRole.VIEWER,
    });

    viewer2 = await createTestUser(em, {
      loginId: 'viewer2',
      password: 'password123',
      name: '구매자2',
      phoneNumber: '010-3333-3333',
      role: UserRole.VIEWER,
    });

    // 셀러 로그인
    sellerToken = await loginTestUser(authService, seller);

    // 테스트 대화 및 메시지 생성
    const conv1 = await messageService.getOrCreateConversation(viewer1.id, seller.id);
    await messageService.sendMessage(viewer1.id, conv1.id, '안녕하세요, 상품 문의드립니다.');
    await messageService.sendMessage(seller.id, conv1.id, '네, 문의 주셔서 감사합니다.');
    await messageService.sendMessage(viewer1.id, conv1.id, '재고가 있나요?');

    const conv2 = await messageService.getOrCreateConversation(viewer2.id, seller.id);
    await messageService.sendMessage(viewer2.id, conv2.id, '배송 문의드립니다.');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v2/seller/messages/conversations', () => {
    it('셀러에게 온 대화 목록을 조회할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/v2/seller/messages/conversations')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      
      // 첫 번째 대화 (viewer2와의 대화 - 더 최근)
      const conv1 = response.body.data.items[0];
      expect(conv1.viewerName).toBe('구매자2');
      expect(conv1.viewerPhoneNumber).toBe('010-3333-3333');
      expect(conv1.lastMessageText).toBe('배송 문의드립니다.');
      expect(conv1.unreadCount).toBe(1);

      // 두 번째 대화 (viewer1과의 대화)
      const conv2 = response.body.data.items[1];
      expect(conv2.viewerName).toBe('구매자1');
      expect(conv2.viewerPhoneNumber).toBe('010-2222-2222');
      expect(conv2.lastMessageText).toBe('재고가 있나요?');
      expect(conv2.unreadCount).toBe(1);
    });

    it('페이지네이션이 동작한다', async () => {
      // 추가 대화 생성
      for (let i = 3; i <= 25; i++) {
        const viewer = await createTestUser(em, {
          loginId: `viewer${i}`,
          password: 'password123',
          name: `구매자${i}`,
          phoneNumber: `010-4${i.toString().padStart(3, '0')}-${i.toString().padStart(4, '0')}`,
          role: UserRole.VIEWER,
        });
        const conv = await messageService.getOrCreateConversation(viewer.id, seller.id);
        await messageService.sendMessage(viewer.id, conv.id, `문의 ${i}`);
      }

      const response = await request(app.getHttpServer())
        .get('/v2/seller/messages/conversations')
        .query({ page: 2, limit: 10 })
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(10);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.total).toBe(25);
    });
  });

  describe('GET /v2/seller/messages/conversations/:conversationId/messages', () => {
    it('특정 대화방의 메시지를 조회할 수 있다', async () => {
      const conversations = await messageService.getSellerConversations(seller.id);
      const conversationId = conversations.items[0].id;

      const response = await request(app.getHttpServer())
        .get(`/v2/seller/messages/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // viewer2와의 대화
      expect(response.body.data[0].text).toBe('배송 문의드립니다.');
    });

    it('다른 셀러의 대화방은 조회할 수 없다', async () => {
      const otherSeller = await createTestUser(em, {
        loginId: 'seller2',
        password: 'password123',
        name: '판매자2',
        role: UserRole.SELLER,
      });

      const conv = await messageService.getOrCreateConversation(viewer1.id, otherSeller.id);
      await messageService.sendMessage(viewer1.id, conv.id, '다른 셀러에게 문의');

      await request(app.getHttpServer())
        .get(`/v2/seller/messages/conversations/${conv.id}/messages`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);
    });
  });

  describe('POST /v2/seller/messages/conversations/:conversationId/reply', () => {
    it('셀러가 메시지에 답변할 수 있다', async () => {
      const conversations = await messageService.getSellerConversations(seller.id);
      const conversationId = conversations.items[1].id; // viewer1과의 대화

      const response = await request(app.getHttpServer())
        .post(`/v2/seller/messages/conversations/${conversationId}/reply`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ text: '네, 재고 있습니다!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe('네, 재고 있습니다!');
      expect(response.body.data.sender.id).toBe(seller.id);
    });

    it('다른 셀러의 대화방에는 답변할 수 없다', async () => {
      const otherSeller = await createTestUser(em, {
        loginId: 'seller2',
        password: 'password123',
        name: '판매자2',
        role: UserRole.SELLER,
      });

      const conv = await messageService.getOrCreateConversation(viewer1.id, otherSeller.id);

      await request(app.getHttpServer())
        .post(`/v2/seller/messages/conversations/${conv.id}/reply`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ text: '답변 시도' })
        .expect(403);
    });
  });
});