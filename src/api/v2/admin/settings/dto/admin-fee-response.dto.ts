import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/module/user/entity/user.entity';

export class AdminFeeResponse {
  @ApiProperty({ description: '셀러 ID' })
  id: string;

  @ApiProperty({ description: '셀러 이름' })
  sellerName: string;

  @ApiProperty({ description: '계좌 정보' })
  bankAccount: string;

  @ApiProperty({ description: '전화번호' })
  phoneNumber: string;

  @ApiProperty({ description: '수수료 비율' })
  feePercentage: number;

  static fromEntity(user: User): AdminFeeResponse {
    return {
      id: user.id,
      sellerName: user.name,
      bankAccount: user.bankAccount || 'N/A',
      phoneNumber: user.phoneNumber || 'N/A',
      feePercentage: user.feePercentage || 0.1, // 기본 수수료 10%
    };
  }
}

export class AdminFeeListResponse {
  @ApiProperty({ description: '응답 데이터' })
  data: {
    items: AdminFeeResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  static fromUsers(users: User[], total: number, page: number, limit: number): AdminFeeListResponse {
    const totalPages = Math.ceil(total / limit);
    return {
      data: {
        items: users.map(AdminFeeResponse.fromEntity),
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
