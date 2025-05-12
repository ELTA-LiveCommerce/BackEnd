import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import { SellerDeliveryListRequestDto } from './delivery.request.dto';
import { SellerDeliveryListResponseDto, SellerDeliveryListItemDto } from './delivery.response.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { DeliveryService } from '@/module/delivery/delivery.service';

@ApiTags('v2/seller/deliveries')
@ApiBearerAuth()
@Controller('v2/seller/deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  @ApiOperation({ summary: '판매자 배송 목록 조회' })
  @ApiOkResponse({ type: SellerDeliveryListResponseDto })
  async getSellerDeliveries(
    @Query() query: SellerDeliveryListRequestDto,
    @GetUser() seller: User,
  ): Promise<SellerDeliveryListResponseDto> {
    const { items, total, page, limit } = await this.deliveryService.findSellerDeliveriesPaged(seller.id, query);

    const responseItems = items.map((item) =>
      SellerDeliveryListItemDto.fromEntities(item.delivery, item.orderItem, item.order),
    );

    return PagedResponseV2.create(responseItems, total, page, limit, '배송 목록 조회 성공');
  }
}
