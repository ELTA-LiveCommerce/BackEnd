import { Entity, ManyToOne, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { Message } from './message.entity';

/**
 * 대화방(쪽지함) 엔티티
 */
@Entity({ tableName: 'conversations' })
export class Conversation extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  /**
   * 뷰어 (문의하는 사용자)
   */
  @ManyToOne(() => User)
  viewer: User;

  /**
   * 셀러 (문의받는 사용자)
   */
  @ManyToOne(() => User)
  seller: User;

  /**
   * 마지막 메시지 전송 시각
   */
  @Property({ type: 'datetime', nullable: true })
  lastMessageAt?: Date;

  /**
   * 마지막 메시지 내용
   */
  @Property({ type: 'text', nullable: true })
  lastMessageText?: string;

  /**
   * 뷰어가 읽지 않은 메시지 수
   */
  @Property({ type: 'number', default: 0 })
  viewerUnreadCount: number = 0;

  /**
   * 셀러가 읽지 않은 메시지 수
   */
  @Property({ type: 'number', default: 0 })
  sellerUnreadCount: number = 0;

  /**
   * 대화방의 메시지들
   */
  @OneToMany(() => Message, (message) => message.conversation)
  messages = new Collection<Message>(this);
}