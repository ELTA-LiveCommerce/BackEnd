import { Controller, Get, Query, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import {
  SellerDeliveryListRequestDto,
  UpdateTrackingInfoRequestDto,
  UpdateDeliveryStatusRequestDto,
} from './delivery.request.dto';
import {
  SellerDeliveryListResponseDto,
  SellerDeliveryListItemDto,
  DeliveryDetailResponseDto,
} from './delivery.response.dto';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
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

    const responseItems = items.flatMap((item) =>
      item.orderItems.map((orderItem) => SellerDeliveryListItemDto.fromEntities(item.delivery, orderItem, item.order)),
    );

    return PagedResponseV2.create(responseItems, total, page, limit, '배송 목록 조회 성공');
  }

  @Patch(':deliveryId/tracking')
  @ApiOperation({ summary: '판매자 배송 송장 정보 수정' })
  @ApiParam({ name: 'deliveryId', description: '배송 ID', type: 'string' })
  @ApiOkResponse({ type: BaseResponseV2<DeliveryDetailResponseDto> })
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateTrackingInfo(
    @Param('deliveryId') deliveryId: string,
    @Body() body: UpdateTrackingInfoRequestDto,
    @GetUser() user: User,
  ): Promise<BaseResponseV2<DeliveryDetailResponseDto>> {
    const updatedDelivery = await this.deliveryService.updateTrackingInfo(
      deliveryId,
      body.trackingNumber,
      body.courierCompany,
      user,
    );
    const responseDto = DeliveryDetailResponseDto.fromEntity(updatedDelivery);
    return BaseResponseV2.success(responseDto, '송장 정보가 업데이트되었습니다.');
  }

  @Patch(':deliveryId/status')
  @ApiOperation({ summary: '판매자 배송 상태 수정' })
  @ApiParam({ name: 'deliveryId', description: '배송 ID', type: 'string' })
  @ApiOkResponse({ type: BaseResponseV2<DeliveryDetailResponseDto> })
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateDeliveryStatus(
    @Param('deliveryId') deliveryId: string,
    @Body() body: UpdateDeliveryStatusRequestDto,
    @GetUser() user: User,
  ): Promise<BaseResponseV2<DeliveryDetailResponseDto>> {
    const updatedDelivery = await this.deliveryService.updateDeliveryStatus(deliveryId, body.deliveryStatus, user);
    const responseDto = DeliveryDetailResponseDto.fromEntity(updatedDelivery);
    return BaseResponseV2.success(responseDto, '배송 상태가 업데이트되었습니다.');
  }
}
