import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreateRefundDto } from '@/module/payment/dto/create-refund.dto';
import { UpdateRefundDto } from '@/module/payment/dto/update-refund.dto';
import { Refund } from '@/module/payment/entity/refund.entity';
import { RefundService } from '@/module/payment/refund.service';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  /**
   * 환불 요청 목록을 조회합니다.
   * 일반 사용자는 자신이 요청한 환불만 볼 수 있습니다.
   * 판매자는 자신의 상품에 대한 환불 요청만 볼 수 있습니다.
   * 관리자는 모든 환불 요청을 볼 수 있습니다.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VIEWER, UserRole.SELLER, UserRole.ADMIN)
  findAll(@Request() req): Promise<Refund[]> {
    return this.refundService.findAll(req.user);
  }

  /**
   * 특정 주문의 환불 요청을 조회합니다.
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VIEWER, UserRole.SELLER, UserRole.ADMIN)
  findByOrder(@Param('orderId') orderId: string, @Request() req): Promise<Refund[]> {
    return this.refundService.findByOrder(orderId, req.user);
  }

  /**
   * ID로 환불 요청을 조회합니다.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VIEWER, UserRole.SELLER, UserRole.ADMIN)
  findOne(@Param('id') id: string, @Request() req): Promise<Refund> {
    return this.refundService.findOne(id, req.user);
  }

  /**
   * 환불을 요청합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VIEWER, UserRole.SELLER, UserRole.ADMIN)
  create(@Body() createRefundDto: CreateRefundDto, @Request() req): Promise<Refund> {
    return this.refundService.create(createRefundDto, req.user);
  }

  /**
   * 환불 요청을 처리합니다 (승인 또는 거절).
   * 판매자 또는 관리자만 환불 요청을 처리할 수 있습니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateRefundDto: UpdateRefundDto, @Request() req): Promise<Refund> {
    return this.refundService.update(id, updateRefundDto, req.user);
  }

  /**
   * 환불 요청을 삭제합니다.
   * 관리자만 환불 요청을 삭제할 수 있습니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.refundService.remove(id, req.user);
  }
}
