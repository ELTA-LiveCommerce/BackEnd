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
      dto.name = user.name;
      dto.profileImage = user.profileImage;
      dto.status = user.status === 'DELETED' ? SellerUserDerivedStatus.DELETED : SellerUserDerivedStatus.ACTIVE;
      dto.createdAt = user.createdAt;
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
