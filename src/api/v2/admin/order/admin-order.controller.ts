import { Body, Controller, Get, HttpStatus, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { OrderService } from '@/module/order/order.service';
import { AdminOrderListRequest, AdminUpdateOrderStatusRequest } from './dto/admin-order-request.dto';
import { AdminOrderResponse, AdminOrderListResponse } from './dto/admin-order-response.dto';

@ApiTags('admin-orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: '주문 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminOrderListResponse })
  @Get()
  async getOrders(@Query() query: AdminOrderListRequest): Promise<AdminOrderListResponse> {
    const result = await this.orderService.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return AdminOrderListResponse.fromResult(result.items, result.total, query.page, query.limit);
  }

  @ApiOperation({ summary: '주문 상세 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminOrderResponse })
  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<AdminOrderResponse> {
    const order = await this.orderService.findOne(id);
    return AdminOrderResponse.fromEntity(order);
  }

  @ApiOperation({ summary: '주문 상태 변경' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminOrderResponse })
  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateOrderStatusRequest,
  ): Promise<AdminOrderResponse> {
    const order = await this.orderService.updateStatus(id, dto.status);
    return AdminOrderResponse.fromEntity(order);
  }
}
