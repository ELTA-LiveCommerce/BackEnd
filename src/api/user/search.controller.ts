import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { AutocompleteDto, AutocompleteResultDto } from '@/module/user/dto/autocomplete.dto';
import { PaginatedSearchResultDto, SearchUserDto } from '@/module/user/dto/search-user.dto';
import { UserService } from '@/module/user/user.service';
import { UserRole } from '@/shared/enum/user-role.enum';

// 요청 사용자 정보를 포함하는 커스텀 인터페이스 정의
interface RequestWithUser {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('search')
export class SearchController {
  constructor(private readonly userService: UserService) {}

  /**
   * 검색어 자동완성 결과를 제공합니다.
   * 이름이나 이메일로 검색된 사용자 목록 중 상위 몇 개만 반환합니다.
   */
  @Get('autocomplete')
  async autocomplete(@Query() autocompleteDto: AutocompleteDto): Promise<AutocompleteResultDto[]> {
    return this.userService.autocomplete(autocompleteDto);
  }

  /**
   * 셀러 자동완성 결과를 제공합니다.
   * 셀러 사용자만 검색합니다.
   */
  @Get('autocomplete/sellers')
  async autocompleteSellers(@Query() autocompleteDto: AutocompleteDto): Promise<AutocompleteResultDto[]> {
    // 셀러 역할로 강제 설정
    autocompleteDto.role = UserRole.SELLER;

    return this.userService.autocomplete(autocompleteDto);
  }

  /**
   * 셀러를 검색합니다.
   * 선택적으로 인증이 있는 경우 팔로우 상태를 포함합니다.
   */
  @Get('sellers')
  async searchSellers(
    @Query() searchDto: SearchUserDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginatedSearchResultDto> {
    const currentUserId = req.user?.id;

    // 셀러 역할로 강제 설정
    searchDto.role = UserRole.SELLER;

    return this.userService.searchUsers(searchDto, currentUserId);
  }

  /**
   * 모든 유저를 검색합니다.
   * 인증이 필요한 엔드포인트입니다.
   */
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async searchUsers(@Query() searchDto: SearchUserDto, @Req() req: RequestWithUser): Promise<PaginatedSearchResultDto> {
    return this.userService.searchUsers(searchDto, req.user?.id);
  }
}
