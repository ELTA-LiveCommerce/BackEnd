import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { DepositService } from '@/module/deposit/deposit.service';
import { AdminDepositListRequest, AdminUpdateDepositStatusRequest } from './dto/admin-deposit-request.dto';
import { AdminDepositResponse, AdminDepositListResponse } from './dto/admin-deposit-response.dto';

@ApiTags('admin-deposit')
@Controller('admin/deposit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDepositController {
  constructor(private readonly depositService: DepositService) {}

  @ApiOperation({ summary: '셀러별 입금 관리 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDepositListResponse })
  @Get()
  async getDepositList(@Query() query: AdminDepositListRequest): Promise<AdminDepositListResponse> {
    const { deposits, total } = await this.depositService.findAllBySeller({
      page: query.page,
      limit: query.limit,
      sellerId: query.sellerId,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return AdminDepositListResponse.fromResult(deposits, total, query.page, query.limit);
  }

  @ApiOperation({ summary: '입금 상세 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDepositResponse })
  @Get(':id')
  async getDeposit(@Param('id') id: string): Promise<AdminDepositResponse> {
    const deposit = await this.depositService.findOne(id);
    return AdminDepositResponse.fromEntity(deposit);
  }

  @ApiOperation({ summary: '입금 상태 수정' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDepositResponse })
  @HttpCode(HttpStatus.OK)
  @Put(':id/status')
  async updateDepositStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateDepositStatusRequest,
  ): Promise<AdminDepositResponse> {
    const deposit = await this.depositService.updateStatus(id, dto.status);
    return AdminDepositResponse.fromEntity(deposit);
  }
}

