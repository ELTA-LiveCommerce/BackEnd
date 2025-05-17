import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';
import { ReturnStatus } from '@/module/order/entity/return-request.entity';
import { ReturnPickupType } from '@/shared/enum/return-pickup-type.enum';
import { ReturnReasonCategory, ReturnReasonDetail } from '@/shared/enum/return-reason.enum';

export class ReturnRequestResponseBody {
  @ApiProperty({ description: '반품 요청 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  id: string;

  @ApiProperty({ description: '주문 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  orderId: string;

  @ApiProperty({ enum: ReturnReasonCategory, description: '반품 사유 카테고리' })
  reasonCategory: ReturnReasonCategory;

  @ApiProperty({ enum: ReturnReasonDetail, description: '반품 사유 상세' })
  reasonDetail: ReturnReasonDetail;

  @ApiProperty({ enum: ReturnStatus, description: '반품 상태' })
  status: ReturnStatus;

  @ApiProperty({ description: '회수자 이름', example: '홍길동' })
  pickupName: string;

  @ApiProperty({ description: '회수지 주소', example: '서울시 강남구 역삼동 123-456' })
  pickupAddress: string;

  @ApiProperty({ enum: ReturnPickupType, description: '회수 요청 방법' })
  pickupType: ReturnPickupType;

  @ApiProperty({ description: '회수 요청 상세 사항', required: false, example: '경비실에 맡겨주세요' })
  pickupNote?: string;

  @ApiProperty({ description: '반품 요청 날짜', example: '2024-06-01T12:34:56Z' })
  requestedAt: Date;

  @ApiProperty({ description: '환불 완료 날짜', required: false, example: '2024-06-03T12:34:56Z' })
  refundedAt?: Date;

  @ApiProperty({ description: '생성일', example: '2024-06-01T12:34:56Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2024-06-01T12:34:56Z' })
  updatedAt: Date;
}

export class ReturnRequestResponse extends BaseResponseV2<ReturnRequestResponseBody> {
  static fromReturnRequest(responseBody: ReturnRequestResponseBody): ReturnRequestResponse {
    return BaseResponseV2.success(responseBody, '반품 요청 정보를 성공적으로 조회했습니다.');
  }
}

export class ReturnRequestListResponse extends BaseResponseV2<ReturnRequestResponseBody[]> {
  static fromReturnRequests(responseBody: ReturnRequestResponseBody[]): ReturnRequestListResponse {
    return BaseResponseV2.success(responseBody, '반품 요청 목록을 성공적으로 조회했습니다.');
  }
}
