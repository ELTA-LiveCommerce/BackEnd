import { Controller, Get, Patch, Param, Body, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserService } from '@/module/user/user.service';
import { User } from '@/module/user/entity/user.entity';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserRole } from '@/shared/enum/user-role.enum';
import { CurrentUser } from '@/shared/common/decorators/current-user.decorator';

import { SellerUserListRequestDto, SellerUserStatusUpdateRequestDto } from './seller-user-request.dto';
import {
  SellerUserListResponseDto,
  SellerUserStatusUpdateResponseDto,
  SellerUserListItemDto,
  SellerUserDerivedStatus,
  UserPurchaseHistoryResponseDto,
} from './seller-user-response.dto';

@ApiTags('v2/seller/users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SELLER)
@Controller('v2/seller/users')
export class SellerUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '판매자 관리 사용자 목록 조회' })
  @ApiOkResponse({ type: SellerUserListResponseDto })
  async getUserList(
    @CurrentUser() seller: User,
    @Query() query: SellerUserListRequestDto,
  ): Promise<SellerUserListResponseDto> {
    // 판매자(seller.id)가 관리할 수 있는 사용자 목록 조회
    const userResults = await this.userService.findUsersForSeller(seller.id, query);
    // 엔티티를 DTO로 변환
    const items = userResults.items.map((user) => {
      const dto = new SellerUserListItemDto();
      dto.id = user.id;
      dto.loginId = user.loginId;
      dto.role = user.role;
      dto.name = user.name;
      dto.profileImage = user.profileImage;
      dto.status = user.isBlocked ? user.isBlocked : SellerUserDerivedStatus.ACTIVE;
      dto.lastLoginAt = user.lastLoginAt;
      dto.createdAt = user.createdAt;

      // 확장된 필드 추가
      dto.phoneNumber = user.phoneNumber;
      dto.address = user.address;
      dto.bankName = user.bankName;
      dto.accountNumber = user.accountNumber;
      dto.totalPaymentAmount = user.totalPaymentAmount || 0;
      dto.totalRefundCount = user.totalRefundCount || 0;

      return dto;
    });

    // 페이지네이션된 응답 생성
    return SellerUserListResponseDto.create(
      items,
      userResults.total,
      userResults.page,
      userResults.limit,
      '사용자 목록 조회 성공',
      HttpStatus.OK,
    );
  }

  @Get(':userId/purchase-history')
  @ApiOperation({ summary: '특정 회원의 구매 상품 기록 조회' })
  @ApiParam({ name: 'userId', description: '조회할 사용자 ID' })
  @ApiOkResponse({ type: UserPurchaseHistoryResponseDto })
  async getUserPurchaseHistory(
    @CurrentUser() seller: User,
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<UserPurchaseHistoryResponseDto> {
    const options = { page, limit, sortBy, sortOrder };
    const result = await this.userService.getUserPurchaseHistory(userId, seller.id, options);

    return UserPurchaseHistoryResponseDto.create(
      result.items,
      result.total,
      result.page,
      result.limit,
      '구매 상품 기록 조회 성공',
      HttpStatus.OK,
    );
  }

  // 판매자가 특정 사용자의 상세 정보를 조회하는 API는 현재 요구사항에 없으므로 생략합니다.
  // 필요시 추가할 수 있습니다. (GET /:userId)

  @Patch(':userId/status')
  @ApiOperation({ summary: '판매자 관리 사용자 상태 변경' })
  @ApiParam({ name: 'userId', description: '대상 사용자 ID' })
  @ApiOkResponse({ type: SellerUserStatusUpdateResponseDto })
  async updateUserStatus(
    @CurrentUser() seller: User,
    @Param('userId') userId: string,
    @Body() updateStatusDto: SellerUserStatusUpdateRequestDto,
  ): Promise<SellerUserStatusUpdateResponseDto> {
    const user = await this.userService.updateUserStatusBySeller(seller.id, userId, updateStatusDto);

    // 응답 DTO로 변환하여 반환
    return SellerUserStatusUpdateResponseDto.success(
      { userId, status: updateStatusDto.status },
      '사용자 상태가 성공적으로 변경되었습니다.',
      HttpStatus.OK,
    );
  }
}

