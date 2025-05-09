import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { DeliveryService } from '@/module/delivery/delivery.service';
import { CreateDeliveryDto } from '@/module/delivery/dto/create-delivery.dto';
import { UpdateDeliveryDto } from '@/module/delivery/dto/update-delivery.dto';
import { Delivery } from '@/module/delivery/entity/delivery.entity';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /**
   * 모든 배송 정보를 조회합니다. (판매자는 자신의 상품 배송만 조회 가능)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  findAll(@Request() req): Promise<Delivery[]> {
    return this.deliveryService.findAll(req.user);
  }

  /**
   * 특정 주문의 배송 정보를 조회합니다.
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  findByOrder(@Param('orderId') orderId: string, @Request() req): Promise<Delivery[]> {
    return this.deliveryService.findByOrder(orderId, req.user);
  }

  /**
   * ID로 배송 정보를 조회합니다.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<Delivery> {
    return this.deliveryService.findOne(id);
  }

  /**
   * 새 배송 정보를 생성합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  create(@Body() createDeliveryDto: CreateDeliveryDto, @Request() req): Promise<Delivery> {
    return this.deliveryService.create(createDeliveryDto, req.user);
  }

  /**
   * 배송 정보를 업데이트합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDeliveryDto: UpdateDeliveryDto, @Request() req): Promise<Delivery> {
    return this.deliveryService.update(id, updateDeliveryDto, req.user);
  }

  /**
   * 배송 정보를 삭제합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.deliveryService.remove(id, req.user);
  }
}
