import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse, BaseOffsetPageResponse, OffsetPage } from '@/shared/common/base-response';

export class AdminSellerStatisticsResponseBody {
  @ApiProperty({ description: '셀러 ID', example: 'user-123' })
  id!: string;

  @ApiProperty({ description: '셀러명', example: '홍길동' })
  sellerName!: string;

  @ApiProperty({ description: '총 매출', example: 5000000 })
  totalSales!: number;

  @ApiProperty({ description: '상품 수', example: 15 })
  productCount!: number;

  @ApiProperty({ description: '방송 수', example: 5 })
  broadcastCount!: number;

  @ApiProperty({ description: '최고 시청자 수', example: 1200 })
  maxViewers!: number;

  @ApiProperty({ description: '프로필 이미지 URL', example: 'https://example.com/profile.jpg' })
  profileImageUrl!: string;

  static fromEntity(entity: any): AdminSellerStatisticsResponseBody {
    const response = new AdminSellerStatisticsResponseBody();
    response.id = entity.id;
    response.sellerName = entity.sellerName;
    response.totalSales = entity.totalSales;
    response.productCount = entity.productCount;
    response.broadcastCount = entity.broadcastCount;
    response.maxViewers = entity.maxViewers || 0; // 아직 구현되지 않은 부분
    response.profileImageUrl = entity.profileImageUrl;
    return response;
  }
}

export class AdminSellerStatisticsListResponseBody extends OffsetPage<AdminSellerStatisticsResponseBody> {
  static fromResult(
    statistics: any[],
    total: number,
    page: number,
    limit: number,
  ): AdminSellerStatisticsListResponseBody {
    const items = statistics.map((stat) => AdminSellerStatisticsResponseBody.fromEntity(stat));
    return new AdminSellerStatisticsListResponseBody(items, total, limit, page);
  }
}

export class AdminSellerStatisticsResponse extends BaseResponse<AdminSellerStatisticsResponseBody> {
  static fromEntity(entity: any): AdminSellerStatisticsResponse {
    const body = AdminSellerStatisticsResponseBody.fromEntity(entity);
    return new AdminSellerStatisticsResponse(body);
  }
}

export class AdminSellerStatisticsListResponse extends BaseOffsetPageResponse<AdminSellerStatisticsResponseBody> {
  static fromResult(statistics: any[], total: number, page: number, limit: number): AdminSellerStatisticsListResponse {
    const body = AdminSellerStatisticsListResponseBody.fromResult(statistics, total, page, limit);
    return new AdminSellerStatisticsListResponse(body);
  }
}
