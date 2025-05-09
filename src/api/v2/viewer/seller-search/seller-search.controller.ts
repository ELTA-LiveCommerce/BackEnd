import { Controller, Get, Query } from '@nestjs/common';

import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

import { SellerSearchRequestDto, SellerSearchItemDto, SellerSearchResponseDto } from './seller-search.dto';

@Controller('v2/viewer/sellers/search')
export class SellerSearchController {
  constructor(private readonly userService: UserService) {}

  /**
   * 키워드로 판매자 검색 (자동완성용)
   */
  @Get()
  async searchSellers(@Query() query: SellerSearchRequestDto): Promise<SellerSearchResponseDto> {
    const { keyword, limit } = query;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    // 판매자 역할을 가진 사용자들 중에서 검색
    const sellers = await this.userService.findByUsernameContaining(keyword, UserRole.SELLER, limitNumber);

    // 응답 데이터 변환
    const searchResults: SellerSearchItemDto[] = sellers.map((seller) => ({
      id: seller.id,
      username: seller.email,
      name: seller.name || seller.email,
      profileImage: seller.profileImage,
    }));

    return SellerSearchResponseDto.success(searchResults);
  }
}
