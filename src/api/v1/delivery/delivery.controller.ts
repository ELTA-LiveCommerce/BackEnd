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
import { DeliveryService } from '@/module/delivery/delivery.service';
import { CreateDeliveryDto } from '@/module/delivery/dto/create-delivery.dto';
import { DeliveryResponseDto } from '@/module/delivery/dto/delivery-response.dto';
import { SearchDeliveryDto } from '@/module/delivery/dto/search-delivery.dto';
import { UpdateDeliveryDto } from '@/module/delivery/dto/update-delivery.dto';
import { DeliveryStatus } from '@/module/delivery/entity/delivery.entity';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

@Controller('v1/deliveries')
@UseInterceptors(ClassSerializerInterceptor)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /**
   * 모든 배송 정보를 조회합니다. (판매자는 자신의 상품 배송만 조회 가능)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async findAll(@Request() req): Promise<DeliveryResponseDto[]> {
    const deliveries = await this.deliveryService.findAll(req.user);
    return DeliveryResponseDto.fromEntities(deliveries);
  }

  /**
   * 배송 정보를 검색합니다. (키워드, 상태, 기간별)
   */
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async search(@Query() searchDto: SearchDeliveryDto, @Request() req): Promise<DeliveryResponseDto[]> {
    const deliveries = await this.deliveryService.search(searchDto, req.user);
    return DeliveryResponseDto.fromEntities(deliveries);
  }

  /**
   * 특정 주문의 배송 정보를 조회합니다.
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async findByOrder(@Param('orderId') orderId: string, @Request() req): Promise<DeliveryResponseDto[]> {
    const deliveries = await this.deliveryService.findByOrder(orderId, req.user);
    return DeliveryResponseDto.fromEntities(deliveries);
  }

  /**
   * ID로 배송 정보를 조회합니다.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.deliveryService.findOne(id);
    return DeliveryResponseDto.fromEntity(delivery);
  }

  /**
   * 새 배송 정보를 생성합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async create(@Body() createDeliveryDto: CreateDeliveryDto, @Request() req): Promise<DeliveryResponseDto> {
    const delivery = await this.deliveryService.create(createDeliveryDto, req.user);
    return DeliveryResponseDto.fromEntity(delivery);
  }

  /**
   * 배송 정보를 업데이트합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
    @Request() req,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.deliveryService.update(id, updateDeliveryDto, req.user);
    return DeliveryResponseDto.fromEntity(delivery);
  }

  /**
   * 선택한 배송 정보의 상태를 일괄 변경합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Put('status/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateStatus(
    @Body() body: { ids: string[]; status: DeliveryStatus },
    @Request() req,
  ): Promise<{ success: boolean; message: string }> {
    await this.deliveryService.updateStatus(body.ids, body.status, req.user);
    return { success: true, message: '배송 상태가 성공적으로 변경되었습니다.' };
  }

  /**
   * 배송 정보를 삭제합니다.
   * 셀러 또는 관리자 권한이 필요합니다.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async remove(@Param('id') id: string, @Request() req): Promise<{ success: boolean; message: string }> {
    await this.deliveryService.remove(id, req.user);
    return { success: true, message: '배송 정보가 성공적으로 삭제되었습니다.' };
  }
}
