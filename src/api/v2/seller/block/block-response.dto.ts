import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';
import { SellerUserBlock, BlockType } from '@/module/user/entity/seller-user-block.entity';
import { User } from '@/module/user/entity/user.entity';

/**
 * 차단된 사용자 정보 응답 바디 DTO
 */
export class SellerBlockedUserResponseBody {
  userId!: string;
  loginId!: string;
  name?: string;
  profileImage?: string;
  blockedAt!: Date;
  reason?: string;
  blockType!: BlockType;

  static fromEntity(blockEntity: SellerUserBlock): SellerBlockedUserResponseBody {
    const responseBody = new SellerBlockedUserResponseBody();
    const blockedUser = blockEntity.blockedUser as User; // Populate된 blockedUser라고 가정

    responseBody.userId = blockedUser.id;
    responseBody.loginId = blockedUser.loginId;
    responseBody.name = blockedUser.name; // User 엔티티에 name이 있다고 가정
    responseBody.profileImage = blockedUser.profileImage; // User 엔티티에 profileImage가 있다고 가정
    responseBody.blockedAt = blockEntity.createdAt; // SellerUserBlock의 생성일자를 차단일자로 사용
    responseBody.reason = blockEntity.reason;
    responseBody.blockType = blockEntity.type;
    return responseBody;
  }
}

/**
 * 차단된 사용자 목록 응답 DTO
 */
export class SellerBlockedUserListResponse extends BaseResponseV2<SellerBlockedUserResponseBody[]> {
  static success(
    data: SellerBlockedUserResponseBody[],
    message = '차단된 사용자 목록입니다.',
  ): SellerBlockedUserListResponse {
    return BaseResponseV2.success(data, message, 200) as SellerBlockedUserListResponse;
  }
}

/**
 * 단일 차단된 사용자 정보 응답 DTO (차단 성공 시)
 */
export class SellerBlockedUserResponse extends BaseResponseV2<SellerBlockedUserResponseBody> {
  static success(data: SellerBlockedUserResponseBody, message = '사용자를 차단했습니다.'): SellerBlockedUserResponse {
    return BaseResponseV2.success(data, message, 201) as SellerBlockedUserResponse;
  }
}
