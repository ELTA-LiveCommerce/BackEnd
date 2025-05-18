import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/module/auth/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { StatisticsService } from '@/module/statistics/statistics.service';
import { AdminSellerStatisticsRequest } from './dto/admin-statistics-request.dto';
import { AdminSellerStatisticsListResponse } from './dto/admin-statistics-response.dto';

@ApiTags('admin-statistics')
@Controller('admin/statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({ summary: '셀러별 통계 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminSellerStatisticsListResponse })
  @Get('sellers')
  async getSellerStatistics(@Query() query: AdminSellerStatisticsRequest): Promise<AdminSellerStatisticsListResponse> {
    const { statistics, total } = await this.statisticsService.getSellerStatistics({
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return AdminSellerStatisticsListResponse.fromResult(statistics, total, query.page || 1, query.limit || 10);
  }
}
