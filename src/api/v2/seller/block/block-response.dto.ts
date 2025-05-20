import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';
import { SellerUserBlock, BlockType } from '@/module/user/entity/seller-user-block.entity';
import { User } from '@/module/user/entity/user.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 차단된 사용자 정보 응답 바디 DTO
 */
export class SellerBlockedUserResponseBody {
  @ApiProperty({ description: '차단 관계 ID', example: 'block-relation-uuid' })
  blockId: string;

  @ApiProperty({ description: '차단된 사용자 ID', example: 'blocked-user-uuid' })
  userId: string;

  @ApiProperty({ description: '차단된 사용자 이름', example: '차단된 사용자' })
  userName: string;

  @ApiProperty({ description: '차단 유형', enum: BlockType, example: BlockType.BLOCKED })
  blockType: BlockType;

  @ApiProperty({ description: '차단 사유', example: '부적절한 메시지', required: false })
  reason?: string;

  @ApiProperty({ description: '차단 일시' })
  blockedAt: Date;

  static fromEntity(entity: SellerUserBlock): SellerBlockedUserResponseBody {
    const responseBody = new SellerBlockedUserResponseBody();
    const blockedUser = entity.blockedUser as User; // Populate된 blockedUser라고 가정

    responseBody.blockId = entity.id;
    responseBody.userId = blockedUser.id;
    responseBody.userName = blockedUser.name;
    responseBody.blockType = entity.type;
    responseBody.reason = entity.reason;
    responseBody.blockedAt = entity.createdAt;
    return responseBody;
  }
}

/**
 * 차단된 사용자 목록 응답 DTO
 */
export class SellerBlockedUserListResponse extends BaseResponseV2<SellerBlockedUserResponseBody[]> {
  // success 메서드 제거
}

/**
 * 단일 차단된 사용자 정보 응답 DTO (차단 성공 시)
 */
export class SellerBlockedUserResponse extends BaseResponseV2<SellerBlockedUserResponseBody> {
  // success 메서드 제거
}
