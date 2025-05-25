import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { OrderService } from '@/module/order/order.service';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { CreateOrderDto } from '@/module/order/dto/create-order.dto';
import { GetOrdersDto } from '@/module/order/dto/get-orders.dto';
import { UpdateShippingDto } from '@/module/order/dto/update-shipping.dto';

import { CancelOrderRequest, CreateOrderRequest, GetOrdersRequest, UpdateShippingRequest } from './order-request.dto';
import { OrderResponse, OrderListResponse, OrderResponseBody, OrderSummaryResponseBody } from './order-response.dto';
import { EmptyResponseV2 } from '@/api/v2/common/base-response.dto';

@ApiTags('v2/viewer/orders')
@Controller('v2/viewer/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 새로운 주문을 생성합니다.
   */
  @Post()
  @ApiOperation({ summary: '주문 생성' })
  @ApiResponse({ status: 201, description: '주문 생성 성공', type: OrderResponse })
  async createOrder(@GetUser() user: User, @Body() createOrderRequest: CreateOrderRequest): Promise<OrderResponse> {
    // CreateOrderRequest를 기존 서비스의 CreateOrderDto로 변환
    const createOrderDto: CreateOrderDto = {
      items: createOrderRequest.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        attributes: item.attributes,
      })),
      paymentMethod: createOrderRequest.paymentMethod,
    };

    const orderResponseDto = await this.orderService.create(user.id, createOrderDto);

    return OrderResponse.fromOrderResponseDto(orderResponseDto as unknown as OrderResponseBody);
  }

  /**
   * 로그인한 사용자의 주문 목록을 조회합니다.
   */
  @Get()
  @ApiOperation({ summary: '내 주문 목록 조회' })
  @ApiResponse({ status: 200, description: '주문 목록 조회 성공', type: OrderListResponse })
  async getMyOrders(@GetUser() user: User, @Query() getOrdersRequest: GetOrdersRequest): Promise<OrderListResponse> {
    // GetOrdersRequest를 기존 서비스의 GetOrdersDto로 변환
    const getOrdersDto: GetOrdersDto = {
      status: getOrdersRequest.status,
      search: getOrdersRequest.search,
      page: getOrdersRequest.page || 1,
      limit: getOrdersRequest.limit || 10,
      sortBy: getOrdersRequest.sortBy || 'createdAt',
      order: getOrdersRequest.order || 'DESC',
      after: getOrdersRequest.after,
    };

    const paginatedOrdersResponseDto = await this.orderService.getOrdersByUser(user.id, getOrdersDto);

    // 응답 형식 변환
    const items = paginatedOrdersResponseDto.items.map((item) => ({
      id: item.id,
      orderNumber: item.orderNumber,
      status: item.status,
      totalAmount: item.totalAmount,
      itemCount: item.itemCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return OrderListResponse.fromPaginatedOrdersResponseDto({
      items,
      total: paginatedOrdersResponseDto.total,
      page: paginatedOrdersResponseDto.page,
      limit: paginatedOrdersResponseDto.limit,
      totalPages: paginatedOrdersResponseDto.totalPages,
    });
  }

  /**
   * 특정 주문의 상세 정보를 조회합니다.
   */
  @Get(':orderId')
  @ApiOperation({ summary: '주문 상세 조회' })
  @ApiParam({ name: 'orderId', description: '주문 ID' })
  @ApiResponse({ status: 200, description: '주문 상세 조회 성공', type: OrderResponse })
  async getOrderDetail(@GetUser() user: User, @Param('orderId') orderId: string): Promise<OrderResponse> {
    const orderResponseDto = await this.orderService.getOrderDetail(orderId, user.id);

    return OrderResponse.fromOrderResponseDto(orderResponseDto as unknown as OrderResponseBody);
  }

  /**
   * 주문을 취소합니다.
   */
  @Post(':orderId/cancel')
  @ApiOperation({ summary: '주문 취소' })
  @ApiParam({ name: 'orderId', description: '주문 ID' })
  @ApiResponse({ status: 200, description: '주문 취소 성공', type: OrderResponse })
  async cancelOrder(
    @GetUser() user: User,
    @Param('orderId') orderId: string,
    @Body() cancelOrderRequest: CancelOrderRequest,
  ): Promise<OrderResponse> {
    const orderResponseDto = await this.orderService.cancelOrder(orderId, user.id, cancelOrderRequest.reason);

    return OrderResponse.fromOrderResponseDto(orderResponseDto as unknown as OrderResponseBody);
  }

  /**
   * 판매자가 배송 정보를 업데이트합니다.
   */
  @Patch(':orderId/shipping-info')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: '배송 정보 업데이트 (판매자)' })
  @ApiParam({ name: 'orderId', description: '주문 ID' })
  @ApiResponse({ status: 200, description: '배송 정보 업데이트 성공', type: OrderResponse })
  async updateShippingInfo(
    @GetUser() user: User,
    @Param('orderId') orderId: string,
    @Body() updateShippingRequest: UpdateShippingRequest,
  ): Promise<OrderResponse> {
    // UpdateShippingRequest를 기존 서비스의 UpdateShippingDto로 변환
    const updateShippingDto: UpdateShippingDto = {
      shippingCode: updateShippingRequest.shippingCode,
      status: updateShippingRequest.status,
      shippingMemo: updateShippingRequest.shippingMemo,
    };

    const orderResponseDto = await this.orderService.updateShippingInfoBySeller(orderId, user.id, updateShippingDto);

    return OrderResponse.fromOrderResponseDto(orderResponseDto as unknown as OrderResponseBody);
  }
}

