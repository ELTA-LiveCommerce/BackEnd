import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

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

export class AdminSellerStatisticsListResponse extends PagedResponseV2<AdminSellerStatisticsResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({
    description: '페이지네이션된 셀러 통계 데이터',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminSellerStatisticsResponseBody' } },
      total: { type: 'number', description: '전체 항목 수' },
      page: { type: 'number', description: '현재 페이지 번호' },
      limit: { type: 'number', description: '페이지당 항목 수' },
      totalPages: { type: 'number', description: '전체 페이지 수' },
    },
  })
  declare data: {
    items: AdminSellerStatisticsResponseBody[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromResult(statistics: any[], total: number, page: number, limit: number): AdminSellerStatisticsListResponse {
    const items = statistics.map((stat) => AdminSellerStatisticsResponseBody.fromEntity(stat));
    return new AdminSellerStatisticsListResponse(items, total, page, limit);
  }
}

export class AdminSellerStatisticsResponse extends BaseResponseV2<AdminSellerStatisticsResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({ description: '셀러 통계 정보', type: AdminSellerStatisticsResponseBody })
  declare data: AdminSellerStatisticsResponseBody;

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromEntity(entity: any): AdminSellerStatisticsResponse {
    const body = AdminSellerStatisticsResponseBody.fromEntity(entity);
    return BaseResponseV2.success(body);
  }
}

