import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

import { Message } from './entity/message.entity';
import { Conversation } from './entity/conversation.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Message)
    private readonly messageRepository: EntityRepository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: EntityRepository<Conversation>,
    private readonly userService: UserService,
  ) {}

  /**
   * 대화방을 생성하거나 기존 대화방을 가져옵니다.
   */
  async getOrCreateConversation(viewerId: string, sellerId: string): Promise<Conversation> {
    let conversation = await this.conversationRepository.findOne({
      viewer: { id: viewerId },
      seller: { id: sellerId },
    });

    if (!conversation) {
      const viewer = await this.userService.findOne(viewerId);
      const seller = await this.userService.findOne(sellerId);

      if (!viewer || !seller) {
        throw new NotFoundException('User not found');
      }

      conversation = new Conversation();
      conversation.viewer = viewer;
      conversation.seller = seller;

      await this.em.persistAndFlush(conversation);
    }

    return conversation;
  }

  /**
   * 셀러 정보와 대화방 정보를 조회합니다.
   */
  async getSellerInfoForMessage(viewerId: string, sellerId: string) {
    const seller = await this.userService.findOne(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const conversation = await this.getOrCreateConversation(viewerId, sellerId);

    return {
      seller: {
        id: seller.id,
        name: seller.name,
        profileImage: seller.profileImage,
        operatingHours: seller.sellerInfo?.operatingHours || '09:00 - 18:00', // 운영시간은 sellerInfo에서 가져옴
      },
      conversationId: conversation.id,
    };
  }

  /**
   * 메시지를 전송합니다.
   */
  async sendMessage(senderId: string, conversationId: string, text: string): Promise<Message> {
    const conversation = await this.conversationRepository.findOne(
      { id: conversationId },
      { populate: ['viewer', 'seller'] },
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 발송자가 대화방 참여자인지 확인
    if (senderId !== conversation.viewer.id && senderId !== conversation.seller.id) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    const sender = await this.userService.findOne(senderId);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = new Message();
    message.conversation = conversation;
    message.sender = sender;
    message.text = text;

    // 대화방 마지막 메시지 정보 업데이트
    conversation.lastMessageAt = new Date();
    conversation.lastMessageText = text;

    // 읽지 않은 메시지 수 증가
    if (senderId === conversation.viewer.id) {
      conversation.sellerUnreadCount += 1;
    } else {
      conversation.viewerUnreadCount += 1;
    }

    await this.em.persistAndFlush([message, conversation]);

    return message;
  }

  /**
   * 대화방의 메시지 목록을 조회합니다.
   */
  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.conversationRepository.findOne(
      { id: conversationId },
      { populate: ['viewer', 'seller'] },
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 사용자가 대화방 참여자인지 확인
    if (userId !== conversation.viewer.id && userId !== conversation.seller.id) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    const messages = await this.messageRepository.find(
      { conversation: { id: conversationId } },
      { populate: ['sender'], orderBy: { createdAt: 'ASC' } },
    );

    // 읽지 않은 메시지를 읽음 처리
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.sender.id !== userId
    );

    for (const msg of unreadMessages) {
      msg.isRead = true;
      msg.readAt = new Date();
    }

    // 읽지 않은 메시지 수 초기화
    if (userId === conversation.viewer.id) {
      conversation.viewerUnreadCount = 0;
    } else {
      conversation.sellerUnreadCount = 0;
    }

    await this.em.flush();

    return messages;
  }

  /**
   * 셀러의 대화방 목록을 조회합니다.
   */
  async getSellerConversations(sellerId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [conversations, total] = await this.conversationRepository.findAndCount(
      { seller: { id: sellerId } },
      {
        populate: ['viewer'],
        orderBy: { lastMessageAt: 'DESC' },
        limit,
        offset,
      },
    );

    return {
      items: conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 특정 대화방에 셀러가 답변합니다.
   */
  async replyAsSelller(sellerId: string, conversationId: string, text: string): Promise<Message> {
    const conversation = await this.conversationRepository.findOne(
      { id: conversationId },
      { populate: ['seller'] },
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.seller.id !== sellerId) {
      throw new ForbiddenException('You are not the seller of this conversation');
    }

    return this.sendMessage(sellerId, conversationId, text);
  }

  /**
   * 메시지 ID로 메시지를 조회합니다.
   */
  async getMessageById(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne(
      { id: messageId },
      { populate: ['sender'] },
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }
}