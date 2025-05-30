import { Controller, Get, Post, Delete, Param, Query, NotFoundException, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiOkResponse, ApiTags, ApiParam, ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';

import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { ProductService } from '@/module/product/product.service';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { User } from '@/module/user/entity/user.entity';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { UserFollowService } from '@/module/user/user-follow.service';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { OptionalJwtAuthGuard } from '@/module/auth/guards/optional-jwt-auth.guard';

import {
  SellerSearchRequestDto,
  SellerInfoRequestDto,
  SellerLiveRequestDto,
  SellerProductRequestDto,
} from './seller-request.dto';
import {
  SellerSearchResponseDto,
  SellerInfoResponseDto,
  SellerLiveResponseDto,
  SellerProductResponseDto,
  SellerFollowResponseDto,
  SellerSearchItemDto,
  SellerInfoDto,
  SellerLiveItemDto,
  SellerProductItemDto,
} from './seller-response.dto';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';

@ApiTags('v2/viewer/sellers')
@Controller('v2/viewer/sellers')
export class SellerController {
  constructor(
    private readonly userService: UserService,
    private readonly broadcastService: BroadcastService,
    private readonly productService: ProductService,
    private readonly userFollowService: UserFollowService,
  ) {}

  /**
   * 키워드로 판매자 검색 (자동완성용)
   */
  @Get('search')
  @ApiOperation({ summary: '판매자 검색' })
  @ApiOkResponse({ type: SellerSearchResponseDto })
  async searchSellers(@Query() query: SellerSearchRequestDto): Promise<SellerSearchResponseDto> {
    try {
      const { keyword, limit = 10 } = query;

      // keyword가 없으면 빈 배열 반환
      if (!keyword || keyword.trim() === '') {
        return BaseResponseV2.success([], '검색어를 입력해주세요.');
      }

      // 판매자 역할을 가진 사용자들 중에서 검색
      const sellers = await this.userService.findByUsernameContaining(keyword, UserRole.SELLER, limit);

      // 응답 데이터 변환
      const searchResults: SellerSearchItemDto[] = sellers.map((seller) => ({
        id: seller.id,
        username: seller.loginId,
        name: seller.name || seller.loginId,
        profileImage: seller.profileImage,
      }));

      return BaseResponseV2.success(searchResults, '판매자 검색 결과입니다.');
    } catch (error) {
      console.error('Seller search error:', error);
      throw error;
    }
  }

  /**
   * 셀러 정보를 조회합니다.
   */
  @Get(':sellerId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '판매자 정보 조회' })
  @ApiOkResponse({ type: SellerInfoResponseDto })
  async getSellerInfo(
    @Param('sellerId') sellerId: string,
    @Query() query: SellerInfoRequestDto,
    @GetUser() currentUser?: User,
  ): Promise<SellerInfoResponseDto> {
    // 사용자 정보 조회
    const seller = await this.userService.findOne(sellerId);

    // 판매자가 존재하지 않으면 NotFoundException 발생
    if (!seller) {
      throw new NotFoundException(`Seller with ID "${sellerId}" not found`);
    }

    // 팔로워 수와 팔로잉 수 조회 (최적화된 메서드 사용)
    const { followersCount, followingCount } = await this.userFollowService.getFollowCounts(sellerId);

    // 현재 사용자가 해당 판매자를 팔로우하고 있는지 확인
    let isFollowing = false;
    if (currentUser) {
      isFollowing = await this.userFollowService.isFollowing(currentUser.id, sellerId);
      console.log('isFollowing result:', isFollowing);
    }

    // 셀러 비즈니스 정보 조회
    let businessInfo: { businessName?: string; businessAddress?: string; businessNumber?: string; description?: string } | null = null;
    try {
      businessInfo = await this.userService.getSellerInfo(sellerId);
    } catch (error) {
      // 비즈니스 정보가 없어도 기본 셀러 정보는 반환
      console.warn(`Failed to get business info for seller ${sellerId}:`, error.message);
    }

    // 응답 데이터 변환
    const sellerInfo: SellerInfoDto = {
      id: seller.id,
      name: seller.name,
      loginId: seller.loginId,
      profileImage: seller.profileImage,
      bannerImage: seller.bannerImage,
      description: businessInfo?.description || '셀러 소개가 없습니다.',
      followers: followersCount,
      following: followingCount,
      isFollowing,
      // 비즈니스 정보 추가
      businessName: businessInfo?.businessName,
      businessAddress: businessInfo?.businessAddress,
      businessNumber: businessInfo?.businessNumber,
    };

    return SellerInfoResponseDto.success(sellerInfo);
  }

  /**
   * 셀러의 라이브 방송 목록을 조회합니다.
   */
  @Get(':sellerId/lives')
  @ApiOperation({ summary: '판매자 라이브 목록 조회' })
  @ApiParam({ name: 'sellerId', description: '판매자 ID' })
  @ApiOkResponse({ description: '판매자 라이브 목록입니다.', type: SellerLiveResponseDto })
  @ApiNotFoundResponse({ description: '판매자를 찾을 수 없습니다.' })
  async getSellerLives(
    @Param('sellerId') sellerId: string,
    @Query() query: SellerLiveRequestDto,
  ): Promise<PagedResponseV2<BroadcastListItemDto>> {
    // Check if seller exists
    await this.userService.findOne(sellerId);

    // Adapt the query for BroadcastService if needed
    const broadcastQuery = {
      page: query.page,
      limit: query.limit,
      // Add other fields if BroadcastListRequestDto expects them (keyword, dates etc.)
    };

    // Call the broadcast service - 뷰어용 메서드로 변경하여 종료된 방송 제외
    const pagedResult = await this.broadcastService.findSellerBroadcastsForViewer(sellerId, broadcastQuery);

    // Map BroadcastListItemDto to SellerLiveItemDto if necessary, or adjust the test
    // For now, assume the test will be adjusted or the controller returns PagedResponseV2<BroadcastListItemDto>

    // TODO: Refine message if needed
    // We directly return the result from broadcastService which is PagedResponseV2<BroadcastListItemDto>
    // The swagger response type SellerLiveResponseDto might need adjustment
    return pagedResult;
  }

  /**
   * 셀러의 상품 목록을 조회합니다.
   */
  @Get(':sellerId/products')
  @ApiOperation({ summary: '판매자 상품 목록 조회' })
  @ApiOkResponse({ type: SellerProductResponseDto })
  async getSellerProducts(
    @Param('sellerId') sellerId: string,
    @Query() query: SellerProductRequestDto,
  ): Promise<SellerProductResponseDto> {
    // 뷰어용 엔드포인트이므로 공개 상품만 조회
    const products = await this.productService.findPublicProductsBySeller(sellerId);

    const items: SellerProductItemDto[] = [];
    for (const product of products) {
      const salesCount = await this.productService.getProductSalesCount(product.id);
      const item = await SellerProductItemDto.fromEntity(product, salesCount);
      items.push(item);
    }

    return BaseResponseV2.success(items, '판매자 상품 목록입니다.');
  }

  /**
   * 셀러를 팔로우합니다.
   */
  @Post(':sellerId/follow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '판매자 팔로우' })
  @ApiParam({ name: 'sellerId', description: '팔로우할 판매자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '팔로우 성공', type: SellerFollowResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '판매자를 찾을 수 없습니다.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '자기 자신은 팔로우할 수 없습니다.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 팔로우 중인 판매자입니다.' })
  async followSeller(@Param('sellerId') sellerId: string, @GetUser() user: User): Promise<SellerFollowResponseDto> {
    await this.userFollowService.followUser(user.id, sellerId);
    return BaseResponseV2.success({ isFollowing: true }, '판매자 팔로우를 성공했습니다.');
  }

  /**
   * 셀러 팔로우를 취소합니다.
   */
  @Delete(':sellerId/follow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '판매자 팔로우 취소' })
  @ApiParam({ name: 'sellerId', description: '팔로우 취소할 판매자 ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '팔로우 취소 성공', type: SellerFollowResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '팔로우 관계를 찾을 수 없습니다.' })
  async unfollowSeller(@Param('sellerId') sellerId: string, @GetUser() user: User): Promise<SellerFollowResponseDto> {
    await this.userFollowService.unfollowUser(user.id, sellerId);
    return BaseResponseV2.success({ isFollowing: false }, '판매자 팔로우를 취소했습니다.');
  }
}

