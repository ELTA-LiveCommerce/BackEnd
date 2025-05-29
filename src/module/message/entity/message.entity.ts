import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { Conversation } from './conversation.entity';

/**
 * 메시지 엔티티
 */
@Entity({ tableName: 'messages' })
export class Message extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  /**
   * 메시지가 속한 대화방
   */
  @ManyToOne(() => Conversation)
  conversation: Conversation;

  /**
   * 메시지 발송자
   */
  @ManyToOne(() => User)
  sender: User;

  /**
   * 메시지 내용
   */
  @Property({ type: 'text' })
  text: string;

  /**
   * 읽음 여부
   */
  @Property({ type: 'boolean', default: false })
  isRead: boolean = false;

  /**
   * 읽은 시각
   */
  @Property({ type: 'datetime', nullable: true })
  readAt?: Date;
}