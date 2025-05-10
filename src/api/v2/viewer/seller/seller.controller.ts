import { Controller, Get, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { ProductService } from '@/module/product/product.service';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

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

@Controller('v2/viewer/sellers')
@UseGuards(AuthGuard('jwt'))
export class SellerController {
  constructor(
    private readonly userService: UserService,
    private readonly broadcastService: BroadcastService,
    private readonly productService: ProductService,
  ) {}

  /**
   * 키워드로 판매자 검색 (자동완성용)
   */
  @Get('search')
  async searchSellers(@Query() query: SellerSearchRequestDto): Promise<SellerSearchResponseDto> {
    const { keyword, limit = 10 } = query;

    // 판매자 역할을 가진 사용자들 중에서 검색
    const sellers = await this.userService.findByUsernameContaining(keyword, UserRole.SELLER, limit);

    // 응답 데이터 변환
    const searchResults: SellerSearchItemDto[] = sellers.map((seller) => ({
      id: seller.id,
      username: seller.email,
      name: seller.name || seller.email,
      profileImage: seller.profileImage,
    }));

    return SellerSearchResponseDto.success(searchResults);
  }

  /**
   * 셀러 정보를 조회합니다.
   */
  @Get(':sellerId')
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
      email: seller.email,
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
  async getSellerLives(
    @Param('sellerId') sellerId: string,
    @Query() query: SellerLiveRequestDto,
  ): Promise<SellerLiveResponseDto> {
    const { page = 1, limit = 10 } = query;

    // 셀러의 방송 목록 조회
    const broadcasts = await this.broadcastService.findBySellerId(sellerId);

    // 페이지네이션 적용
    const total = broadcasts.length;
    const skip = (page - 1) * limit;
    const paginatedBroadcasts = broadcasts.slice(skip, skip + limit);

    // 응답 데이터 변환
    const items: SellerLiveItemDto[] = paginatedBroadcasts.map((broadcast) => ({
      id: broadcast.id,
      title: broadcast.title,
      thumbnailImage: broadcast.thumbnailImage,
      viewerCount: 0, // 실제 구현 필요
      startedAt: broadcast.scheduledDate,
      status: broadcast.isLive ? 'LIVE' : 'SCHEDULED',
    }));

    const livePageDto: SellerLivePageDto = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return SellerLiveResponseDto.success(livePageDto);
  }

  /**
   * 셀러의 상품 목록을 조회합니다.
   */
  @Get(':sellerId/products')
  async getSellerProducts(
    @Param('sellerId') sellerId: string,
    @Query() query: SellerProductRequestDto,
  ): Promise<SellerProductResponseDto> {
    const { page = 1, limit = 10 } = query;

    // 셀러의 상품 목록 조회
    const products = await this.productService.findProductsBySeller(sellerId);

    // 페이지네이션 적용
    const total = products.length;
    const skip = (page - 1) * limit;
    const paginatedProducts = products.slice(skip, skip + limit);

    // 응답 데이터 변환
    const items: SellerProductItemDto[] = paginatedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      thumbnailImage: product.mainImage,
      description: product.shortDescription,
      stock: product.stockQuantity,
      salesCount: 0, // 실제 구현 필요
      rating: 0, // 실제 구현 필요
    }));

    const productPageDto: SellerProductPageDto = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return SellerProductResponseDto.success(productPageDto);
  }
}
