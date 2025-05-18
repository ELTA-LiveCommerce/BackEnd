import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

export class AdminUserResponseBody {
  @ApiProperty({ description: '사용자 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  id: string;

  @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '사용자 닉네임', example: 'gildong' })
  nickname: string;

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
    response.email = entity.loginId + '@example.com';
    response.name = entity.name;
    response.nickname = entity.loginId;
    response.role = entity.role;
    response.phoneNumber = entity.phoneNumber;
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    return response;
  }
}

export class AdminUserResponse {
  @ApiProperty({ description: '응답 상태', example: true })
  success: boolean;

  @ApiProperty({ type: AdminUserResponseBody })
  data: AdminUserResponseBody;

  static fromEntity(entity: User): AdminUserResponse {
    return {
      success: true,
      data: AdminUserResponseBody.fromEntity(entity),
    };
  }
}

export class AdminUserListResponseBody {
  @ApiProperty({ type: [AdminUserResponseBody] })
  items: AdminUserResponseBody[];

  @ApiProperty({ description: '총 아이템 수', example: 100 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '총 페이지 수', example: 10 })
  pages: number;

  constructor(items: AdminUserResponseBody[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.pages = Math.ceil(total / limit);
  }
}

export class AdminUserListResponse {
  @ApiProperty({ description: '응답 상태', example: true })
  success: boolean;

  @ApiProperty({ type: AdminUserListResponseBody })
  data: AdminUserListResponseBody;

  static fromResult(users: User[], total: number, page: number, limit: number): AdminUserListResponse {
    const items = users.map((user) => AdminUserResponseBody.fromEntity(user));
    return {
      success: true,
      data: new AdminUserListResponseBody(items, total, page, limit),
    };
  }
}

