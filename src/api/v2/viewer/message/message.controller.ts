import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import { MessageService } from '@/module/message/message.service';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

import { SendMessageRequestDto, GetMessagesRequestDto } from './message-request.dto';
import {
  GetSellerInfoResponseDto,
  SendMessageResponseDto,
  GetMessagesResponseDto,
  MessageDto,
  GetConversationListResponseDto,
  ConversationListItemDto,
} from './message-response.dto';

@ApiTags('v2/viewer/messages')
@ApiBearerAuth()
@Controller('v2/viewer/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * 내 문의 내역 목록 조회
   */
  @Get('conversations')
  @ApiOperation({ summary: '내 문의 내역 목록 조회' })
  @ApiOkResponse({ type: GetConversationListResponseDto })
  async getConversations(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @GetUser() user: User,
  ): Promise<GetConversationListResponseDto> {
    const result = await this.messageService.getViewerConversations(user.id, page, limit);
    
    const items = result.items.map(conversation => 
      ConversationListItemDto.fromConversation(conversation)
    );
    
    return GetConversationListResponseDto.create(
      items,
      result.total,
      result.page,
      result.limit,
      '문의 내역을 조회했습니다.'
    );
  }

  /**
   * 셀러 정보 조회 (쪽지창 열 때)
   */
  @Get('sellers/:sellerId')
  @ApiOperation({ summary: '쪽지창용 셀러 정보 조회' })
  @ApiOkResponse({ type: GetSellerInfoResponseDto })
  async getSellerInfo(
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
    @GetUser() user: User,
  ): Promise<GetSellerInfoResponseDto> {
    const result = await this.messageService.getSellerInfoForMessage(user.id, sellerId);
    return BaseResponseV2.success(result, '셀러 정보를 조회했습니다.');
  }

  /**
   * 대화방의 메시지 목록 조회
   */
  @Get('conversations/:conversationId')
  @ApiOperation({ summary: '대화방 메시지 목록 조회' })
  @ApiOkResponse({ type: GetMessagesResponseDto })
  async getMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: GetMessagesRequestDto,
    @GetUser() user: User,
  ): Promise<GetMessagesResponseDto> {
    const messages = await this.messageService.getMessages(user.id, conversationId);
    const messageDtos = messages.map((msg) => MessageDto.fromEntity(msg));
    return BaseResponseV2.success(messageDtos, '메시지 목록을 조회했습니다.');
  }

  /**
   * 메시지 전송
   */
  @Post('conversations/:conversationId')
  @ApiOperation({ summary: '메시지 전송' })
  @ApiOkResponse({ type: SendMessageResponseDto })
  async sendMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageRequestDto,
    @GetUser() user: User,
  ): Promise<SendMessageResponseDto> {
    const message = await this.messageService.sendMessage(user.id, conversationId, dto.text);
    // sender 정보를 포함하여 메시지를 다시 조회
    const messageWithSender = await this.messageService.getMessageById(message.id);
    const messageDto = MessageDto.fromEntity(messageWithSender);
    return BaseResponseV2.success(messageDto, '메시지를 전송했습니다.');
  }
}