import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { CreatePaymentDto } from '@/module/payment/dto/create-payment.dto';
import { PaymentResponseDto } from '@/module/payment/dto/payment-response.dto';
import { SearchPaymentDto } from '@/module/payment/dto/search-payment.dto';
import { UpdatePaymentDto } from '@/module/payment/dto/update-payment.dto';
import { PaymentStatus } from '@/module/payment/entity/payment.entity';
import { PaymentService } from '@/module/payment/payment.service';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('payments')
@UseInterceptors(ClassSerializerInterceptor)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 모든 입금 정보를 조회합니다. (판매자는 자신의 상품 입금만 조회 가능)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async findAll(@Request() req): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentService.findAll(req.user);
    return PaymentResponseDto.fromEntities(payments);
  }

  /**
   * 입금 정보를 검색합니다. (키워드, 상태, 기간별)
   */
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async search(@Query() searchDto: SearchPaymentDto, @Request() req): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentService.search(searchDto, req.user);
    return PaymentResponseDto.fromEntities(payments);
  }

  /**
   * 특정 주문의 입금 정보를 조회합니다.
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async findByOrder(@Param('orderId') orderId: string, @Request() req): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentService.findByOrder(orderId, req.user);
    return PaymentResponseDto.fromEntities(payments);
  }

  /**
   * ID로 입금 정보를 조회합니다.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.findOne(id);
    return PaymentResponseDto.fromEntity(payment);
  }

  /**
   * 새 입금 정보를 생성합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.create(createPaymentDto, req.user);
    return PaymentResponseDto.fromEntity(payment);
  }

  /**
   * 입금 정보를 업데이트합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.update(id, updatePaymentDto, req.user);
    return PaymentResponseDto.fromEntity(payment);
  }

  /**
   * 선택한 입금 정보의 상태를 일괄 변경합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put('status/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateStatus(
    @Body() body: { ids: string[]; status: PaymentStatus },
    @Request() req,
  ): Promise<{ success: boolean; message: string }> {
    await this.paymentService.updateStatus(body.ids, body.status, req.user);
    return { success: true, message: '입금 상태가 성공적으로 변경되었습니다.' };
  }

  /**
   * 입금 정보를 삭제합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async remove(@Param('id') id: string, @Request() req): Promise<{ success: boolean; message: string }> {
    await this.paymentService.remove(id, req.user);
    return { success: true, message: '입금 정보가 성공적으로 삭제되었습니다.' };
  }
}
