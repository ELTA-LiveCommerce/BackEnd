import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
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

  // TODO: Add endpoints for create, update, delete broadcasts

  @Post('start')
  @ApiOperation({ summary: '판매자 라이브 방송 시작' })
  @ApiOkResponse({ type: BroadcastListItemDto })
  start(@Req() req) {
    const hostId = req.user.id as string;
    return this.broadcastService.start(hostId);
  }

  /** 시청자 입장 */
  @Post('join')
  @ApiOperation({ summary: '판매자 라이브 방송 시청자 입장' })
  @ApiOkResponse({ type: BroadcastListItemDto })
  join(@Body() dto: JoinStreamDto, @Req() req) {
    const userId = req.user.id as string;
    return this.broadcastService.join(dto.channelId, userId);
  }

  /** 토큰 재발급 */
  @Post('renew')
  @ApiOperation({ summary: '판매자 라이브 방송 토큰 재발급' })
  @ApiOkResponse({ type: BroadcastListItemDto })
  renew(@Body() dto: RenewTokenDto) {
    return this.broadcastService.renew(dto.channelId, dto.uid, dto.role);
  }
}
