import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
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
import { BroadcastUpdateRequestDto } from './dto/broadcast-update.request.dto';
import { BroadcastResponseDto } from './dto/broadcast.response.dto';
import {
  UpdateCurrentSellingProductDto,
  CurrentSellingProductDto,
  BroadcastProductsResponseDto,
} from '@/module/broadcast/dto/current-selling-product.dto';
import { ApiResponse } from '@/api/v2/common/api-response.dto';
import { BroadcastAnnouncementDto, BroadcastAnnouncementResponseDto } from '@/module/broadcast/dto/broadcast-announcement.dto';

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

  @Put(':id')
  @ApiOperation({ summary: '판매자 라이브 방송 정보 수정' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({
    description: '방송 정보가 성공적으로 수정되었습니다.',
    type: BroadcastResponseDto,
  })
  async updateBroadcast(
    @Param('id') broadcastId: string,
    @CurrentUser() seller: User,
    @Body() updateBroadcastDto: BroadcastUpdateRequestDto,
  ): Promise<BroadcastResponseDto> {
    const updatedBroadcastItem = await this.broadcastService.updateBroadcast(broadcastId, seller.id, updateBroadcastDto);
    return new BroadcastResponseDto(updatedBroadcastItem);
  }

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

  @Delete(':id')
  @ApiOperation({ summary: '판매자 라이브 방송 삭제' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({ description: '방송 삭제 응답' })
  async delete(@Param('id') broadcastId: string, @CurrentUser() seller: User) {
    return this.broadcastService.delete(broadcastId, seller.id);
  }

  /**
   * 방송에서 판매 중인 상품 목록 조회
   */
  @Get(':id/products')
  @ApiOperation({ summary: '방송의 상품 목록 조회' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({
    description: '방송 상품 목록',
    type: ApiResponse.withData(BroadcastProductsResponseDto),
  })
  async getBroadcastProducts(
    @Param('id') broadcastId: string,
    @CurrentUser() seller: User,
  ): Promise<ApiResponse<BroadcastProductsResponseDto>> {
    // 권한 검증은 서비스 계층에서 처리됩니다
    const products = await this.broadcastService.getBroadcastProducts(broadcastId);
    return ApiResponse.success(BroadcastProductsResponseDto.fromEntities(products), '방송 상품 목록 조회 성공');
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
    @CurrentUser() seller: User,
  ): Promise<ApiResponse<CurrentSellingProductDto | null>> {
    // 권한 검증은 서비스 계층에서 처리됩니다
    const currentProduct = await this.broadcastService.getCurrentSellingProduct(broadcastId);

    // 현재 판매 중인 상품이 없는 경우 null 반환
    if (!currentProduct) {
      return ApiResponse.success(null, '현재 판매 중인 상품이 없습니다.');
    }

    const productDto = CurrentSellingProductDto.fromEntity(currentProduct);
    return ApiResponse.success(productDto, '방송 상품 조회 성공');
  }

  /**
   * 현재 방송 공지 변경
   */
  @Put(':id/announcement')
  @ApiOperation({ summary: '현재 방송 공지 변경' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({
    description: '변경된 방송 공지 정보',
    type: ApiResponse.withData(BroadcastAnnouncementResponseDto),
  })
  async updateBroadcastAnnouncement(
    @Param('id') broadcastId: string,
    @Body() dto: BroadcastAnnouncementDto,
    @CurrentUser() seller: User,
  ): Promise<ApiResponse<BroadcastAnnouncementResponseDto>> {
    const updatedAnnouncement = await this.broadcastService.updateBroadcastAnnouncement(
      broadcastId,
      dto.content,
      seller.id,
    );

    return ApiResponse.success(
      BroadcastAnnouncementResponseDto.fromEntity({ content: updatedAnnouncement }),
      '방송 공지가 변경되었습니다.',
    );
  }

  /**
   * 현재 방송에서 판매 중인 상품 변경
   */
  @Put(':id/current-product')
  @ApiOperation({ summary: '현재 방송에서 판매 중인 상품 변경' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({
    description: '변경된 판매 상품 정보',
    type: ApiResponse.withData(CurrentSellingProductDto),
  })
  async updateCurrentSellingProduct(
    @Param('id') broadcastId: string,
    @Body() dto: UpdateCurrentSellingProductDto,
    @CurrentUser() seller: User,
  ): Promise<ApiResponse<CurrentSellingProductDto>> {
    const updatedProduct = await this.broadcastService.updateCurrentSellingProduct(
      broadcastId,
      dto,
      seller.id,
    );

    const productDto = CurrentSellingProductDto.fromEntity(updatedProduct);
    // null이 아님을 확인
    if (!productDto) {
      throw new Error('상품 정보를 변환하는 중 오류가 발생했습니다.');
    }

    return ApiResponse.success(productDto, '현재 판매 상품이 변경되었습니다.');
  }

  /**
   * 현재 방송에서 판매 중인 상품 판매 중지
   */
  @Delete(':id/current-product')
  @ApiOperation({ summary: '현재 방송에서 판매 중인 상품 판매 중지' })
  @ApiParam({ name: 'id', description: '방송 ID' })
  @ApiOkResponse({
    description: '판매 중지 처리 결과',
    type: ApiResponse.withData(Object),
  })
  async stopSellingProduct(
    @Param('id') broadcastId: string,
    @CurrentUser() seller: User,
  ): Promise<ApiResponse<{ success: boolean }>> {
    await this.broadcastService.stopSellingProduct(broadcastId, seller.id);

    return ApiResponse.success({ success: true }, '상품 판매가 중지되었습니다.');
  }
}

