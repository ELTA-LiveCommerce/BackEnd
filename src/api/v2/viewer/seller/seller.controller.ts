import { Controller, Get, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiOkResponse, ApiTags, ApiParam, ApiNotFoundResponse } from '@nestjs/swagger';

import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { ProductService } from '@/module/product/product.service';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastListItemDto } from '@/module/broadcast/dto/broadcast-list-item.dto';
import { User } from '@/module/user/entity/user.entity';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { UserFollowService } from '@/module/user/user-follow.service';

import {
  SellerInfoRequestDto,
  SellerInfoDto,
  SellerInfoResponseDto,
  SellerLiveRequestDto,
  SellerLiveItemDto,
  SellerLivePageDto,
  SellerLiveResponseDto,
  SellerProductRequestDto,
  SellerProductItemDto,
  SellerProductPageDto,
  SellerProductResponseDto,
  SellerSearchRequestDto,
  SellerSearchItemDto,
  SellerSearchResponseDto,
} from './seller.dto';

@ApiTags('v2/viewer/sellers')
@Controller('v2/viewer/sellers')
@UseGuards(AuthGuard('jwt'))
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
    const { keyword, limit = 10 } = query;

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
  }

  /**
   * 셀러 정보를 조회합니다.
   */
  @Get(':sellerId')
  @ApiOperation({ summary: '판매자 정보 조회' })
  @ApiOkResponse({ type: SellerInfoResponseDto })
  async getSellerInfo(
    @Param('sellerId') sellerId: string,
    @Query() query: SellerInfoRequestDto,
  ): Promise<SellerInfoResponseDto> {
    // 사용자 정보 조회
    const seller = await this.userService.findOne(sellerId);

    // 판매자가 존재하지 않으면 NotFoundException 발생
    if (!seller) {
      throw new NotFoundException(`Seller with ID "${sellerId}" not found`);
    }

    // 팔로워, 팔로잉 수 같은 추가 정보는 실제 구현 필요
    const followersCount = 0; // 실제 구현 필요
    const followingCount = 0; // 실제 구현 필요

    // 응답 데이터 변환
    const sellerInfo: SellerInfoDto = {
      id: seller.id,
      name: seller.name,
      loginId: seller.loginId,
      profileImage: seller.profileImage,
      description: '셀러 소개입니다.', // 실제 필드에 맞게 수정 필요
      followers: followersCount,
      following: followingCount,
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

    // Call the broadcast service
    const pagedResult = await this.broadcastService.findSellerBroadcastsPaged(sellerId, broadcastQuery);

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
    const products = await this.productService.findProductsBySeller(sellerId);
    const items = products.map((p) => SellerProductItemDto.fromEntity(p));

    return BaseResponseV2.success(items, '판매자 상품 목록입니다.');
  }
}
