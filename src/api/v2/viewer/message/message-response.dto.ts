import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Message } from '@/module/message/entity/message.entity';
import { Conversation } from '@/module/message/entity/conversation.entity';

/**
 * 셀러 정보 DTO
 */
export class SellerInfoForMessageDto {
  @ApiProperty({ description: '셀러 ID', example: 'seller-uuid-123' })
  id: string;

  @ApiProperty({ description: '셀러 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '프로필 이미지 URL', example: 'https://example.com/profile.jpg' })
  profileImage?: string;

  @ApiProperty({ description: '운영 시작 시간', example: '09:00' })
  operatingStartTime: string;

  @ApiProperty({ description: '운영 종료 시간', example: '18:00' })
  operatingEndTime: string;
}

/**
 * 셀러 정보 조회 응답 DTO
 */
export class GetSellerInfoResponseDto extends BaseResponseV2<{
  seller: SellerInfoForMessageDto;
  conversationId: string;
}> {}

/**
 * 메시지 DTO
 */
export class MessageDto {
  @ApiProperty({ description: '메시지 ID', example: 'msg-uuid-123' })
  id: string;

  @ApiProperty({ description: '발송자 ID', example: 'user-uuid-123' })
  senderId: string;

  @ApiProperty({ description: '발송자 이름', example: '홍길동' })
  senderName: string;

  @ApiProperty({ description: '메시지 내용', example: '안녕하세요' })
  text: string;

  @ApiProperty({ description: '읽음 여부', example: false })
  isRead: boolean;

  @ApiProperty({ description: '전송 시각', example: '2024-01-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '읽은 시각', example: '2024-01-01T12:30:00.000Z', required: false })
  readAt?: Date;

  static fromEntity(message: Message): MessageDto {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.senderId = message.sender.id;
    dto.senderName = message.sender.name;
    dto.text = message.text;
    dto.isRead = message.isRead;
    dto.createdAt = message.createdAt;
    dto.readAt = message.readAt;
    return dto;
  }
}

/**
 * 메시지 전송 응답 DTO
 */
export class SendMessageResponseDto extends BaseResponseV2<MessageDto> {}

/**
 * 메시지 목록 조회 응답 DTO
 */
export class GetMessagesResponseDto extends BaseResponseV2<MessageDto[]> {}

/**
 * 문의 내역 아이템 DTO
 */
export class ConversationListItemDto {
  @ApiProperty({ description: '대화방 ID', example: 'conv-uuid-123' })
  conversationId: string;

  @ApiProperty({ description: '셀러 ID', example: 'seller-uuid-123' })
  sellerId: string;

  @ApiProperty({ description: '셀러명', example: '판매자1' })
  sellerName: string;

  @ApiProperty({ description: '셀러 프로필 이미지 URL', example: 'https://example.com/profile.jpg', required: false })
  sellerProfileImage?: string;

  @ApiProperty({ description: '셀러 운영 시작 시간', example: '09:00', required: false })
  sellerOperatingStartTime?: string;

  @ApiProperty({ description: '셀러 운영 종료 시간', example: '18:00', required: false })
  sellerOperatingEndTime?: string;

  @ApiProperty({ description: '최근 대화 텍스트', example: '안녕하세요, 문의 드립니다.', required: false })
  lastMessageText?: string;

  @ApiProperty({ description: '최근 대화 일시', example: '2024-01-01T12:00:00.000Z', required: false })
  lastMessageAt?: Date;

  @ApiProperty({ description: '안읽은 메시지 개수', example: 3 })
  unreadCount: number;

  static fromConversation(conversation: Conversation): ConversationListItemDto {
    const dto = new ConversationListItemDto();
    dto.conversationId = conversation.id;
    dto.sellerId = conversation.seller.id;
    dto.sellerName = conversation.seller.name;
    dto.sellerProfileImage = conversation.seller.profileImage;
    dto.sellerOperatingStartTime = conversation.seller.sellerInfo?.operatingStartTime;
    dto.sellerOperatingEndTime = conversation.seller.sellerInfo?.operatingEndTime;
    dto.lastMessageText = conversation.lastMessageText;
    dto.lastMessageAt = conversation.lastMessageAt;
    dto.unreadCount = conversation.viewerUnreadCount;
    return dto;
  }
}

/**
 * 문의 내역 목록 응답 DTO
 */
export class GetConversationListResponseDto extends PagedResponseV2<ConversationListItemDto> {}