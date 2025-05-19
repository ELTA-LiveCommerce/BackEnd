import { Controller, Get, Param, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Roles } from '@/shared/common/decorators/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { UserService } from '@/module/user/user.service';
import { AdminBroadcastListRequest } from './dto/admin-broadcast-request.dto';
import { AdminBroadcastListResponse, AdminBroadcastResponse } from './dto/admin-broadcast-response.dto';
import { BroadcastListRequestDto } from '@/api/v2/seller/lives/dto/broadcast-list.request.dto';

@ApiTags('admin-broadcasts')
@Controller('admin/broadcasts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBroadcastController {
  constructor(
    private readonly broadcastService: BroadcastService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: '셀러별 방송 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminBroadcastListResponse })
  @Get()
  async getBroadcasts(@Query() query: AdminBroadcastListRequest): Promise<AdminBroadcastListResponse> {
    // 셀러 ID로 필터링
    const { sellerId, page = 1, limit = 10, search, sortBy, sortOrder } = query;

    let broadcasts;
    let total = 0;

    if (sellerId) {
      // 특정 셀러의 방송 목록
      const requestDto: BroadcastListRequestDto = {
        page,
        limit,
        keyword: search,
      };

      const pagedResult = await this.broadcastService.findSellerBroadcastsPaged(sellerId, requestDto);

      // 브로드캐스트 엔티티 조회
      const broadcastIds = pagedResult.data.items.map((item) => item.id);
      broadcasts = await Promise.all(broadcastIds.map((id) => this.broadcastService.findOne(id)));
      total = pagedResult.data.total;
    } else {
      // 모든 방송 목록 조회 (for Admin)
      const allBroadcasts = await this.broadcastService.findAll();

      // 검색 필터링
      let filteredBroadcasts = allBroadcasts;
      if (search) {
        filteredBroadcasts = allBroadcasts.filter((broadcast) =>
          broadcast.title.toLowerCase().includes(search.toLowerCase()),
        );
      }

      // 정렬
      if (sortBy) {
        filteredBroadcasts.sort((a, b) => {
          const aValue = (a as any)[sortBy];
          const bValue = (b as any)[sortBy];

          if (typeof aValue === 'string') {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          }

          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        });
      }

      // 페이지네이션
      total = filteredBroadcasts.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      broadcasts = filteredBroadcasts.slice(start, end);
    }

    return AdminBroadcastListResponse.fromResult(broadcasts, total, page, limit);
  }

  @ApiOperation({ summary: '방송 상세 정보 조회' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminBroadcastResponse })
  @Get(':id')
  async getBroadcast(@Param('id') id: string): Promise<{ data: AdminBroadcastResponse }> {
    const broadcast = await this.broadcastService.findOne(id);
    const response = AdminBroadcastResponse.fromEntity(broadcast);
    return { data: response };
  }
}

