import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';

import { SellerRefundListRequestDto } from '@/module/refund/dto/seller-refund-list-request.dto';
import { SellerRefundListItemDto } from '@/module/refund/dto/seller-refund-list-item.dto';
import { SellerRefundStatusUpdateDto } from '@/module/refund/dto/seller-refund-status-update.dto';
import { RefundStatusHistoryDto } from '@/module/refund/dto/refund-status-history.dto';
import { RefundService } from '@/module/refund/refund.service';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserDecorator } from '@/shared/common/decorators/user.decorator';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { User } from '@/module/user/entity/user.entity';
import { RefundEntity } from '@/module/refund/entity/refund.entity';

@ApiTags('v2/seller/refund')
@Controller('v2/seller/refunds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get()
  @ApiOperation({
    summary: '판매자 반품 목록 조회',
    description: '자신의 상품에 대한 반품 요청 목록을 조회합니다.',
  })
  @ApiOkResponse({ description: '환불 목록 조회 성공', type: PagedResponseV2 })
  async getSellerRefunds(
    @Query() query: SellerRefundListRequestDto,
    @UserDecorator() seller: User,
  ): Promise<PagedResponseV2<SellerRefundListItemDto>> {
    return this.refundService.findSellerRefundsPaged(seller.id, query);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: '판매자 반품 상태 변경',
    description: '반품 요청의 상태를 변경합니다 (반품대기중, 반품 회수중, 반품완료 등)',
  })
  @ApiParam({ name: 'id', description: '반품 ID' })
  @ApiOkResponse({
    description: '반품 상태 변경 성공',
    type: BaseResponseV2,
  })
  async updateRefundStatus(
    @Param('id') id: string,
    @Body() statusUpdateDto: SellerRefundStatusUpdateDto,
    @UserDecorator() seller: User,
  ): Promise<BaseResponseV2<RefundEntity>> {
    const updatedRefund = await this.refundService.updateRefundStatus(id, statusUpdateDto, seller);
    return BaseResponseV2.success(updatedRefund);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: '반품 상태 변경 히스토리 조회',
    description: '특정 반품 요청의 상태 변경 히스토리를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '반품 ID' })
  @ApiOkResponse({
    description: '반품 상태 변경 히스토리 조회 성공',
    type: () => BaseResponseV2,
  })
  async getRefundStatusHistory(
    @Param('id') id: string,
    @UserDecorator() seller: User,
  ): Promise<BaseResponseV2<RefundStatusHistoryDto[]>> {
    const historyList = await this.refundService.getRefundStatusHistory(id, seller);
    return BaseResponseV2.success(historyList);
  }
}

