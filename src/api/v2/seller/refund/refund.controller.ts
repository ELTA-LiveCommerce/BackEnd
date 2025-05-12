import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SellerRefundListRequestDto } from '@/module/refund/dto/seller-refund-list-request.dto';
import { SellerRefundListItemDto } from '@/module/refund/dto/seller-refund-list-item.dto';
import { RefundService } from '@/module/refund/refund.service';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { UserDecorator } from '@/shared/common/decorators/user.decorator';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { User } from '@/module/user/entity/user.entity';

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
}
