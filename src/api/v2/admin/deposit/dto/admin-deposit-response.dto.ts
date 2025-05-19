import { ApiProperty } from '@nestjs/swagger';
import { DepositStatus } from '@/shared/enum/deposit-status.enum';
import { BaseResponse, BaseOffsetPageResponse, OffsetPage } from '@/shared/common/base-response';

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

export class AdminDepositListResponseBody extends OffsetPage<AdminDepositResponseBody> {
  static fromResult(deposits: any[], total: number, page: number, limit: number): AdminDepositListResponseBody {
    const items = deposits.map((deposit) => AdminDepositResponseBody.fromEntity(deposit));
    return new AdminDepositListResponseBody(items, total, limit, page);
  }
}

export class AdminDepositResponse extends BaseResponse<AdminDepositResponseBody> {
  static fromEntity(deposit: any): AdminDepositResponse {
    const body = AdminDepositResponseBody.fromEntity(deposit);
    return new AdminDepositResponse(body);
  }
}

export class AdminDepositListResponse extends BaseOffsetPageResponse<AdminDepositResponseBody> {
  static fromResult(deposits: any[], total: number, page: number, limit: number): AdminDepositListResponse {
    const body = AdminDepositListResponseBody.fromResult(deposits, total, page, limit);
    return new AdminDepositListResponse(body);
  }
}

