import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateOrderDto } from '@/module/order/dto/create-order.dto';
import { GetOrdersDto } from '@/module/order/dto/get-orders.dto';
import { OrderResponseDto, PaginatedOrdersResponseDto } from '@/module/order/dto/order-response.dto';
import { UpdateShippingDto } from '@/module/order/dto/update-shipping.dto';
import { OrderService } from '@/module/order/order.service';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserDecorator } from '@/shared/common/decorators/user.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

class CancelOrderDto {
  reason?: string;
}

interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
}

@Controller('v1/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(
    @UserDecorator() user: AuthenticatedUser,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.create(user.id, createOrderDto);
  }

  @Get()
  async getMyOrders(
    @UserDecorator() user: AuthenticatedUser,
    @Query() getOrdersDto: GetOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.orderService.getOrdersByUser(user.id, getOrdersDto);
  }

  @Get(':id')
  async getOrderDetail(
    @UserDecorator() user: AuthenticatedUser,
    @Param('id') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.getOrderDetail(orderId, user.id);
  }

  @Post(':id/cancel')
  async cancelOrder(
    @UserDecorator() user: AuthenticatedUser,
    @Param('id') orderId: string,
    @Body() cancelDto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.cancelOrder(orderId, user.id, cancelDto.reason);
  }

  @Patch(':orderId/shipping-info')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  async updateShippingInfo(
    @UserDecorator() seller: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() updateShippingDto: UpdateShippingDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.updateShippingInfoBySeller(orderId, seller.id, updateShippingDto);
  }
}
