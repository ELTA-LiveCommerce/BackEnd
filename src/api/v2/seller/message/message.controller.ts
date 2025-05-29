import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import { MessageService } from '@/module/message/message.service';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { MessageDto } from '@/api/v2/viewer/message/message-response.dto';

import { GetConversationsRequestDto, ReplyMessageRequestDto } from './message-request.dto';
import {
  GetConversationsResponseDto,
  ReplyMessageResponseDto,
  ConversationListItemDto,
} from './message-response.dto';

@ApiTags('v2/seller/messages')
@ApiBearerAuth()
@Controller('v2/seller/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class SellerMessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * 셀러에게 온 쪽지 목록 조회
   */
  @Get('conversations')
  @ApiOperation({ summary: '받은 쪽지 목록 조회' })
  @ApiOkResponse({ type: GetConversationsResponseDto })
  async getConversations(
    @Query() query: GetConversationsRequestDto,
    @GetUser() seller: User,
  ): Promise<GetConversationsResponseDto> {
    const result = await this.messageService.getSellerConversations(
      seller.id,
      query.page,
      query.limit,
    );

    const items = result.items.map((conv) => ConversationListItemDto.fromEntity(conv));

    return PagedResponseV2.create(
      items,
      result.total,
      result.page,
      result.limit,
      '쪽지 목록을 조회했습니다.',
    );
  }

  /**
   * 특정 대화방의 메시지 조회
   */
  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: '대화방 메시지 목록 조회' })
  @ApiOkResponse({ type: BaseResponseV2 })
  async getConversationMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @GetUser() seller: User,
  ): Promise<BaseResponseV2<MessageDto[]>> {
    const messages = await this.messageService.getMessages(seller.id, conversationId);
    const messageDtos = messages.map((msg) => MessageDto.fromEntity(msg));
    return BaseResponseV2.success(messageDtos, '메시지 목록을 조회했습니다.');
  }

  /**
   * 특정 쪽지에 답변
   */
  @Post('conversations/:conversationId/reply')
  @ApiOperation({ summary: '쪽지 답변 전송' })
  @ApiOkResponse({ type: ReplyMessageResponseDto })
  async replyToMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: ReplyMessageRequestDto,
    @GetUser() seller: User,
  ): Promise<ReplyMessageResponseDto> {
    const message = await this.messageService.replyAsSelller(
      seller.id,
      conversationId,
      dto.text,
    );
    // sender 정보를 포함하여 메시지를 다시 조회
    const messageWithSender = await this.messageService.getMessageById(message.id);
    const messageDto = MessageDto.fromEntity(messageWithSender);
    return BaseResponseV2.success(messageDto, '답변을 전송했습니다.');
  }
}