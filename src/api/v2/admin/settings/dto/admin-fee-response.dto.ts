import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/module/user/entity/user.entity';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

export class AdminFeeResponseBody {
  @ApiProperty({ description: '셀러 ID' })
  id: string;

  @ApiProperty({ description: '셀러 이름' })
  sellerName: string;

  @ApiProperty({ description: '계좌 정보' })
  bankAccount: string;

  @ApiProperty({ description: '전화번호' })
  phoneNumber: string;

  @ApiProperty({ description: '수수료 비율' })
  feePercentage?: number;

  static fromEntity(user: User): AdminFeeResponseBody {
    return {
      id: user.id,
      sellerName: user.name,
      bankAccount: user.bankAccount || 'N/A',
      phoneNumber: user.phoneNumber || 'N/A',
      feePercentage: user.feePercentage, // 기본 수수료 10%
    };
  }
}

export class AdminFeeResponse extends BaseResponseV2<AdminFeeResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({ description: '셀러 수수료 정보', type: AdminFeeResponseBody })
  declare data: AdminFeeResponseBody;

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromEntity(user: User): AdminFeeResponse {
    const body = AdminFeeResponseBody.fromEntity(user);
    return BaseResponseV2.success(body);
  }
}

export class AdminFeeListResponse extends PagedResponseV2<AdminFeeResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({
    description: '페이지네이션된 셀러 수수료 목록 데이터',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminFeeResponseBody' } },
      total: { type: 'number', description: '전체 항목 수' },
      page: { type: 'number', description: '현재 페이지 번호' },
      limit: { type: 'number', description: '페이지당 항목 수' },
      totalPages: { type: 'number', description: '전체 페이지 수' },
    },
  })
  declare data: {
    items: AdminFeeResponseBody[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromUsers(users: User[], total: number, page: number, limit: number): AdminFeeListResponse {
    const items = users.map(AdminFeeResponseBody.fromEntity);
    return new AdminFeeListResponse(items, total, page, limit);
  }
}

