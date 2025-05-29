import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Conversation } from '@/module/message/entity/conversation.entity';
import { MessageDto } from '@/api/v2/viewer/message/message-response.dto';

/**
 * 대화방 목록 아이템 DTO
 */
export class ConversationListItemDto {
  @ApiProperty({ description: '대화방 ID', example: 'conv-uuid-123' })
  id: string;

  @ApiProperty({ description: '뷰어 ID', example: 'user-uuid-123' })
  viewerId: string;

  @ApiProperty({ description: '뷰어 이름', example: '김철수' })
  viewerName: string;

  @ApiProperty({ description: '뷰어 프로필 이미지', example: 'https://example.com/profile.jpg' })
  viewerProfileImage?: string;

  @ApiProperty({ description: '마지막 메시지 전송 시각', example: '2024-01-01T12:00:00.000Z' })
  lastMessageAt?: Date;

  @ApiProperty({ description: '마지막 메시지 내용', example: '안녕하세요' })
  lastMessageText?: string;

  @ApiProperty({ description: '읽지 않은 메시지 수', example: 3 })
  unreadCount: number;

  static fromEntity(conversation: Conversation): ConversationListItemDto {
    const dto = new ConversationListItemDto();
    dto.id = conversation.id;
    dto.viewerId = conversation.viewer.id;
    dto.viewerName = conversation.viewer.name;
    dto.viewerProfileImage = conversation.viewer.profileImage;
    dto.lastMessageAt = conversation.lastMessageAt;
    dto.lastMessageText = conversation.lastMessageText;
    dto.unreadCount = conversation.sellerUnreadCount;
    return dto;
  }
}

/**
 * 대화방 목록 조회 응답 DTO
 */
export class GetConversationsResponseDto extends PagedResponseV2<ConversationListItemDto> {}

/**
 * 답변 전송 응답 DTO
 */
export class ReplyMessageResponseDto extends BaseResponseV2<MessageDto> {}