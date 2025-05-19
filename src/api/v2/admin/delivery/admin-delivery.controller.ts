import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { User } from '@/module/user/entity/user.entity';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { SellerDeliverySearchField } from '@/api/v2/seller/delivery/delivery-search-field.enum';
import {
  AdminDeliveryListRequest,
  AdminUpdateDeliveryStatusRequest,
  AdminUpdateDeliveryTrackingRequest,
} from './dto/admin-delivery-request.dto';
import { AdminDeliveryResponse, AdminDeliveryListResponse } from './dto/admin-delivery-response.dto';

@ApiTags('admin-delivery')
@Controller('admin/delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @ApiOperation({ summary: '셀러별 배송 관리 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDeliveryListResponse })
  @Get()
  async getDeliveryList(
    @Query() query: AdminDeliveryListRequest,
    @GetUser() user: User,
  ): Promise<AdminDeliveryListResponse> {
    const result = await this.deliveryService.findSellerDeliveriesPaged(query.sellerId, {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      searchField: query.search ? SellerDeliverySearchField.TRACKING_NUMBER : undefined,
      searchKeyword: query.search,
      sortOrder: query.sortOrder,
    });

    return AdminDeliveryListResponse.fromResult(
      result.items.map((item) => ({
        delivery: item.delivery,
        orderItems: item.orderItems,
      })),
      result.total,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @ApiOperation({ summary: '배송 상세 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDeliveryResponse })
  @Get(':id')
  async getDelivery(@Param('id') id: string): Promise<AdminDeliveryResponse> {
    const delivery = await this.deliveryService.findOne(id);

    // 주문 아이템 정보는 임시로 null 처리 (필요시 서비스에서 조회 로직 추가 필요)
    return AdminDeliveryResponse.fromEntity(delivery);
  }

  @ApiOperation({ summary: '배송 상태 수정' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDeliveryResponse })
  @HttpCode(HttpStatus.OK)
  @Put(':id/status')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateDeliveryStatusRequest,
    @GetUser() user: User,
  ): Promise<AdminDeliveryResponse> {
    const delivery = await this.deliveryService.updateDeliveryStatus(id, dto.status, user);
    return AdminDeliveryResponse.fromEntity(delivery);
  }

  @ApiOperation({ summary: '배송 송장 정보 수정' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDeliveryResponse })
  @HttpCode(HttpStatus.OK)
  @Put(':id/tracking')
  async updateDeliveryTracking(
    @Param('id') id: string,
    @Body() dto: AdminUpdateDeliveryTrackingRequest,
    @GetUser() user: User,
  ): Promise<AdminDeliveryResponse> {
    const delivery = await this.deliveryService.updateTrackingInfo(id, dto.trackingNumber, dto.courierCompany, user);
    return AdminDeliveryResponse.fromEntity(delivery);
  }
}

