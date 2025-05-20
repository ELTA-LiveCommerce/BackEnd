import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import {
  CurrentSellingProductDto,
  BroadcastProductsResponseDto,
} from '@/module/broadcast/dto/current-selling-product.dto';
import { ApiResponse } from '@/api/v2/common/api-response.dto';

@ApiTags('v2/viewer/lives')
@Controller('v2/viewer/lives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VIEWER, UserRole.SELLER)
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

  /** 시청자 입장 */
  @Post('join')
  @ApiOperation({ summary: '판매자 라이브 방송 시청자 입장' })
  @ApiOkResponse({ description: '방송 입장 응답' })
  join(@Body() dto: JoinStreamDto, @CurrentUser() user: User) {
    return this.broadcastService.join(dto.broadcastId, user.id);
  }

  /** 토큰 재발급 */
  @Post('renew')
  @ApiOperation({ summary: '판매자 라이브 방송 토큰 재발급' })
  @ApiOkResponse({ description: '토큰 재발급 응답' })
  renew(@Body() dto: RenewTokenDto) {
    return this.broadcastService.renew(dto.broadcastId, dto.uid, dto.role);
  }

  @Post('renew-chat')
  @ApiOperation({ summary: '판매자 라이브 방송 채팅 토큰 재발급' })
  @ApiOkResponse({ description: '채팅 토큰 재발급 응답' })
  async renewChat(@Body() dto: RenewTokenDto) {
    return this.broadcastService.renewChat(dto.uid);
  }

  /**
   * 현재 방송에서 판매 중인 상품 조회
   */
  @Get(':id/current-product')
  @ApiOperation({ summary: '현재 방송에서 판매 중인 상품 조회' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({
    description: '현재 판매 중인 상품 정보. 없을 경우 null',
    type: ApiResponse.withData(CurrentSellingProductDto),
  })
  async getCurrentSellingProduct(
    @Param('id') broadcastId: string,
  ): Promise<ApiResponse<CurrentSellingProductDto | null>> {
    const currentProduct = await this.broadcastService.getCurrentSellingProduct(broadcastId);

    // 현재 판매 중인 상품이 없는 경우 null 반환
    if (!currentProduct) {
      return ApiResponse.success(null, '현재 판매 중인 상품이 없습니다.');
    }

    return ApiResponse.success(CurrentSellingProductDto.fromEntity(currentProduct), '방송 상품 조회 성공');
  }

  /**
   * 방송의 전체 상품 목록 조회
   */
  @Get(':id/products')
  @ApiOperation({ summary: '방송의 전체 상품 목록 조회' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({
    description: '방송 상품 목록',
    type: ApiResponse.withData(BroadcastProductsResponseDto),
  })
  async getBroadcastProducts(@Param('id') broadcastId: string): Promise<ApiResponse<BroadcastProductsResponseDto>> {
    const products = await this.broadcastService.getBroadcastProducts(broadcastId);
    return ApiResponse.success(BroadcastProductsResponseDto.fromEntities(products), '방송 상품 목록 조회 성공');
  }
}

