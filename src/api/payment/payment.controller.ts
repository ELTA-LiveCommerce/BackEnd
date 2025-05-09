import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreatePaymentDto } from '@/module/payment/dto/create-payment.dto';
import { UpdatePaymentDto } from '@/module/payment/dto/update-payment.dto';
import { Payment } from '@/module/payment/entity/payment.entity';
import { PaymentService } from '@/module/payment/payment.service';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 모든 입금 정보를 조회합니다. (셀러는 자신의 상품 입금만 조회 가능)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  findAll(@Request() req): Promise<Payment[]> {
    return this.paymentService.findAll(req.user);
  }

  /**
   * 특정 주문의 입금 정보를 조회합니다.
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  findByOrder(@Param('orderId') orderId: string, @Request() req): Promise<Payment[]> {
    return this.paymentService.findByOrder(orderId, req.user);
  }

  /**
   * ID로 입금 정보를 조회합니다.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.findOne(id);
  }

  /**
   * 새 입금 정보를 생성합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req): Promise<Payment> {
    return this.paymentService.create(createPaymentDto, req.user);
  }

  /**
   * 입금 정보를 업데이트합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Request() req): Promise<Payment> {
    return this.paymentService.update(id, updatePaymentDto, req.user);
  }

  /**
   * 입금 정보를 삭제합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.paymentService.remove(id, req.user);
  }
}
