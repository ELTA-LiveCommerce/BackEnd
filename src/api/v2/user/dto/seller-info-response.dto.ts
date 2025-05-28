import { ApiProperty } from '@nestjs/swagger';

import { BaseResponse } from '@/shared/common/base.dto';

export class SellerInfoResponseBody {
  @ApiProperty({ example: 'ABC 상사', description: '상호명', required: false })
  businessName?: string;

  @ApiProperty({ example: '서울시 강남구 테헤란로 123', description: '사업자주소', required: false })
  businessAddress?: string;

  @ApiProperty({ example: '123-45-67890', description: '사업자번호', required: false })
  businessNumber?: string;

  static fromResult(result: {
    businessName?: string;
    businessAddress?: string;
    businessNumber?: string;
  }): SellerInfoResponseBody {
    const response = new SellerInfoResponseBody();
    response.businessName = result.businessName;
    response.businessAddress = result.businessAddress;
    response.businessNumber = result.businessNumber;
    return response;
  }
}

export class SellerInfoResponse extends BaseResponse<SellerInfoResponseBody> {
  @ApiProperty({ type: SellerInfoResponseBody })
  declare data: SellerInfoResponseBody;
}

