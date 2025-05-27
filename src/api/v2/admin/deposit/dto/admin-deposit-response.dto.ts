import { ApiProperty } from '@nestjs/swagger';
import { DepositStatus } from '@/shared/enum/deposit-status.enum';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

export class AdminDepositResponseBody {
  @ApiProperty({ description: '입금 ID', example: 'deposit-123' })
  id!: string;

  @ApiProperty({ description: '상품 ID', example: 'product-123' })
  productId!: string;

  @ApiProperty({ description: '상품 이미지 URL', example: 'https://example.com/image.jpg' })
  productImageUrl!: string;

  @ApiProperty({ description: '상품명', example: '스마트폰' })
  productName!: string;

  @ApiProperty({ description: '구매 수량', example: 2 })
  quantity!: number;

  @ApiProperty({ description: '입금 금액', example: 50000 })
  amount!: number;

  @ApiProperty({ description: '입금 시각', example: '2023-06-01T12:00:00Z' })
  depositedAt!: Date;

  @ApiProperty({ description: '입금 상태', enum: DepositStatus, example: DepositStatus.COMPLETED })
  status!: DepositStatus;

  @ApiProperty({ description: '셀러 ID', example: 'user-123' })
  sellerId!: string;

  @ApiProperty({ description: '셀러 이름', example: '홍길동' })
  sellerName!: string;

  static fromEntity(deposit: any): AdminDepositResponseBody {
    const response = new AdminDepositResponseBody();
    response.id = deposit.id;
    response.productId = deposit.product.id;
    response.productImageUrl = deposit.product.imageUrl;
    response.productName = deposit.product.name;
    response.quantity = deposit.quantity;
    response.amount = deposit.amount;
    response.depositedAt = deposit.depositedAt;
    response.status = deposit.status;
    response.sellerId = deposit.seller?.id || '';
    response.sellerName = deposit.seller?.name || '';
    return response;
  }
}

export class AdminDepositListResponse extends PagedResponseV2<AdminDepositResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({
    description: '페이지네이션된 입금 목록 데이터',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminDepositResponseBody' } },
      total: { type: 'number', description: '전체 항목 수' },
      page: { type: 'number', description: '현재 페이지 번호' },
      limit: { type: 'number', description: '페이지당 항목 수' },
      totalPages: { type: 'number', description: '전체 페이지 수' },
    },
  })
  declare data: {
    items: AdminDepositResponseBody[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromResult(deposits: any[], total: number, page: number, limit: number): AdminDepositListResponse {
    const items = deposits.map((deposit) => AdminDepositResponseBody.fromEntity(deposit));
    return new AdminDepositListResponse(items, total, page, limit);
  }
}

export class AdminDepositResponse extends BaseResponseV2<AdminDepositResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({ description: '입금 상세 정보', type: AdminDepositResponseBody })
  declare data: AdminDepositResponseBody;

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromEntity(deposit: any): AdminDepositResponse {
    const body = AdminDepositResponseBody.fromEntity(deposit);
    return BaseResponseV2.success(body);
  }
}

