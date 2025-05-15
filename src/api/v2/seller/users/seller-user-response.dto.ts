import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { User } from '@/module/user/entity/user.entity';
import { SellerUserStatus as RequestSellerUserStatus } from './seller-user-request.dto'; // Enum import from request DTO

// Define status based on deletedAt
export enum SellerUserDerivedStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export class SellerUserListItemDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '로그인 ID' })
  loginId: string;

  @ApiProperty({ description: '사용자 이름' })
  name: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  profileImage?: string;

  @ApiProperty({ description: '사용자 상태 (ACTIVE/DELETED)', enum: SellerUserDerivedStatus })
  status: SellerUserDerivedStatus;

  @ApiProperty({ description: '가입일' })
  createdAt: Date;

  // 필요에 따라 DTO 변환 로직 추가
  static fromEntity(user: User): SellerUserListItemDto {
    const dto = new SellerUserListItemDto();
    dto.id = user.id;
    dto.loginId = user.loginId;
    dto.name = user.name;
    dto.profileImage = user.profileImage;
    // Determine status based on deletedAt field
    dto.status = user.deletedAt ? SellerUserDerivedStatus.DELETED : SellerUserDerivedStatus.ACTIVE;
    dto.createdAt = user.createdAt;
    return dto;
  }
}

export class SellerUserListResponseDto extends PagedResponseV2<SellerUserListItemDto> {}

// Status update might just return success/failure or the updated user ID
// Returning the full DTO might require re-fetching the user
export class SellerUserStatusUpdateResponseDto extends BaseResponseV2<{
  userId: string;
  status: RequestSellerUserStatus;
}> {}
