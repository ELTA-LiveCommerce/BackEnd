import { Controller, Get, Query, UseGuards, Body, Patch, HttpCode, HttpStatus } from '@nestjs/common';
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
import { SellerDepositListRequestDto, ConfirmDepositRequestDto } from './deposit.request.dto';
import { SellerDepositSearchField } from './deposit-search-field.enum';
import { SellerDepositDateField } from './deposit-date-field.enum';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

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

  @Patch('confirm')
  @ApiOperation({
    summary: '판매자 입금 확인 처리',
    description: '주어진 주문 ID 목록에 대해 입금 확인(처리 중 상태)으로 변경합니다.',
  })
  @ApiOkResponse({ description: '입금 확인 처리 성공', type: BaseResponseV2 })
  @HttpCode(HttpStatus.OK)
  async confirmDeposits(
    @Body() confirmDepositDto: ConfirmDepositRequestDto,
    @UserDecorator() seller: User,
  ): Promise<BaseResponseV2<unknown>> {
    await this.depositService.confirmDeposits(seller.id, confirmDepositDto.orderIds);
    return BaseResponseV2.success(null, '선택한 주문들의 입금 확인 처리가 완료되었습니다.');
  }
}
