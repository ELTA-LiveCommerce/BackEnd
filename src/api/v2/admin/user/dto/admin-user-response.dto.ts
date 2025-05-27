import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

export class AdminUserResponseBody {
  @ApiProperty({ description: '사용자 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  id: string;

  @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ enum: UserRole, description: '사용자 역할', example: UserRole.VIEWER })
  role: UserRole;

  @ApiProperty({ description: '전화번호', example: '01012345678', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: '생성일', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: User): AdminUserResponseBody {
    const response = new AdminUserResponseBody();
    response.id = entity.id;
    response.email = entity.loginId;
    response.name = entity.name;
    response.role = entity.role;
    response.phoneNumber = entity.phoneNumber;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    return response;
  }
}

export class AdminUserResponse extends BaseResponseV2<AdminUserResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({ description: '사용자 상세 정보', type: AdminUserResponseBody })
  declare data: AdminUserResponseBody;

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromEntity(entity: User): AdminUserResponse {
    const body = AdminUserResponseBody.fromEntity(entity);
    return BaseResponseV2.success(body);
  }
}

export class AdminUserListResponse extends PagedResponseV2<AdminUserResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({
    description: '페이지네이션된 사용자 목록 데이터',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminUserResponseBody' } },
      total: { type: 'number', description: '전체 항목 수' },
      page: { type: 'number', description: '현재 페이지 번호' },
      limit: { type: 'number', description: '페이지당 항목 수' },
      totalPages: { type: 'number', description: '전체 페이지 수' },
    },
  })
  declare data: {
    items: AdminUserResponseBody[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromResult(users: User[], total: number, page: number, limit: number): AdminUserListResponse {
    const items = users.map((user) => AdminUserResponseBody.fromEntity(user));
    return new AdminUserListResponse(items, total, page, limit);
  }
}

