import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { BroadcastListRequestDto } from './dto/broadcast-list.request.dto';
import { BroadcastPagedResponseDto } from './dto/broadcast-paged-response.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
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
}
