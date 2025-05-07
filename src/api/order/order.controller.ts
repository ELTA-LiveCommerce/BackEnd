import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { CreateOrderDto } from '@/module/order/dto/create-order.dto';
import { GetOrdersDto } from '@/module/order/dto/get-orders.dto';
import { OrderResponseDto, PaginatedOrdersResponseDto } from '@/module/order/dto/order-response.dto';
import { OrderService } from '@/module/order/order.service';
import { UserDecorator } from '@/shared/common/decorators/user.decorator';

class CancelOrderDto {
  reason?: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@UserDecorator() user: any, @Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.orderService.create(user.id, createOrderDto);
  }

  @Get()
  async getMyOrders(
    @UserDecorator() user: any,
    @Query() getOrdersDto: GetOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.orderService.getOrdersByUser(user.id, getOrdersDto);
  }

  @Get(':id')
  async getOrderDetail(@UserDecorator() user: any, @Param('id') orderId: string): Promise<OrderResponseDto> {
    return this.orderService.getOrderDetail(orderId, user.id);
  }

  @Post(':id/cancel')
  async cancelOrder(
    @UserDecorator() user: any,
    @Param('id') orderId: string,
    @Body() cancelDto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.cancelOrder(orderId, user.id, cancelDto.reason);
  }
}
