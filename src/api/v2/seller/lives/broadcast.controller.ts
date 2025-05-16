import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { BroadcastListRequestDto } from './dto/broadcast-list.request.dto';
import { BroadcastPagedResponseDto } from './dto/broadcast-paged-response.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { JoinStreamDto } from '@/module/broadcast/dto/join-stream.dto';
import { RenewTokenDto } from '@/module/broadcast/dto/renew-token.dto';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { CurrentUser } from '@/shared/common/decorators/current-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import { BroadcastCreateRequestDto } from './dto/broadcast-create.request.dto';
import { BroadcastResponseDto } from './dto/broadcast.response.dto';

@ApiTags('v2/seller/lives')
@Controller('v2/seller/lives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Get()
  @ApiOperation({ summary: '판매자 라이브 방송 목록 조회' })
  @ApiOkResponse({ type: BroadcastPagedResponseDto })
  async findMyBroadcasts(
    @CurrentUser() seller: User,
    @Query() query: BroadcastListRequestDto,
  ): Promise<PagedResponseV2<BroadcastListItemDto>> {
    return this.broadcastService.findSellerBroadcastsPaged(seller.id, query);
  }

  @Post()
  @ApiOperation({ summary: '판매자 라이브 방송 정보 등록' })
  @ApiCreatedResponse({
    description: '방송 정보가 성공적으로 등록되었습니다.',
    type: BroadcastResponseDto,
  })
  async createBroadcast(
    @CurrentUser() seller: User,
    @Body() createBroadcastDto: BroadcastCreateRequestDto,
  ): Promise<BroadcastResponseDto> {
    const createdBroadcastItem = await this.broadcastService.createBroadcast(createBroadcastDto, seller.id);
    return new BroadcastResponseDto(createdBroadcastItem);
  }

  // TODO: Add endpoints for update, delete broadcasts
  // TODO: Add endpoints for create, update, delete broadcasts

  @Post(':id/start')
  @ApiOperation({ summary: '판매자 라이브 방송 시작' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({ description: '방송 시작 응답' })
  async start(@Param('id') broadcastId: string, @CurrentUser() seller: User) {
    return this.broadcastService.start(seller.id, broadcastId);
  }

  @Post(':id/end')
  @ApiOperation({ summary: '판매자 라이브 방송 종료' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({ description: '방송 종료 응답' })
  async end(@Param('id') broadcastId: string, @CurrentUser() seller: User) {
    return this.broadcastService.end(broadcastId, seller.id);
  }

  /** 시청자 입장 */
  @Post('join')
  @ApiOperation({ summary: '판매자 라이브 방송 시청자 입장' })
  @ApiOkResponse({ description: '방송 입장 응답' })
  join(@Body() dto: JoinStreamDto, @CurrentUser() user: User) {
    return this.broadcastService.join(dto.channelId, user.id);
  }

  /** 토큰 재발급 */
  @Post('renew')
  @ApiOperation({ summary: '판매자 라이브 방송 토큰 재발급' })
  @ApiOkResponse({ description: '토큰 재발급 응답' })
  renew(@Body() dto: RenewTokenDto) {
    return this.broadcastService.renew(dto.channelId, dto.uid, dto.role);
  }
}
