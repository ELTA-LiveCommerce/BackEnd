import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DepositService } from '@/module/deposit/deposit.service';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserDecorator } from '@/shared/common/decorators/user.decorator';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { User } from '@/module/user/entity/user.entity';
import { DepositListItemDto } from '@/module/deposit/dto/deposit-list-item.dto';
import { SellerDepositListRequestDto } from './deposit.request.dto';

@ApiTags('v2/seller/deposit')
@Controller('v2/seller/deposits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Get()
  @ApiOperation({
    summary: '판매자 입금 관리 목록 조회',
    description: '자신의 상품 판매에 대한 입금(완료) 내역을 조회합니다.',
  })
  @ApiOkResponse({ description: '입금 관리 목록 조회 성공', type: PagedResponseV2<DepositListItemDto> })
  async getSellerDeposits(
    @Query() query: SellerDepositListRequestDto,
    @UserDecorator() seller: User,
  ): Promise<PagedResponseV2<DepositListItemDto>> {
    return this.depositService.findSellerDepositsPaged(seller.id, query);
  }
}
