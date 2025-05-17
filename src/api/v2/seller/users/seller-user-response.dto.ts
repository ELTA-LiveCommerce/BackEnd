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

  @ApiProperty({ description: '전화번호', required: false })
  phoneNumber?: string;

  @ApiProperty({ description: '주소', required: false })
  address?: string;

  @ApiProperty({ description: '은행명', required: false })
  bankName?: string;

  @ApiProperty({ description: '계좌번호', required: false })
  accountNumber?: string;

  @ApiProperty({ description: '총 결제 금액', default: 0 })
  totalPaymentAmount: number;

  @ApiProperty({ description: '총 환불 건수', default: 0 })
  totalRefundCount: number;

  // 필요에 따라 DTO 변환 로직 추가
  static fromEntity(user: User, totalPaymentAmount = 0, totalRefundCount = 0): SellerUserListItemDto {
    const dto = new SellerUserListItemDto();
    dto.id = user.id;
    dto.loginId = user.loginId;
    dto.name = user.name;
    dto.profileImage = user.profileImage;
    // Determine status based on deletedAt field
    dto.status = user.deletedAt ? SellerUserDerivedStatus.DELETED : SellerUserDerivedStatus.ACTIVE;
    dto.createdAt = user.createdAt;

    // 확장된 필드 추가
    dto.phoneNumber = user.phoneNumber;
    dto.address = user.address;
    dto.bankName = user.bankName;
    dto.accountNumber = user.accountNumber;
    dto.totalPaymentAmount = totalPaymentAmount;
    dto.totalRefundCount = totalRefundCount;

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

// 특정 회원의 구매 상품 기록 응답 DTO
export class UserPurchaseHistoryItemDto {
  @ApiProperty({ description: '주문 ID' })
  orderId: string;

  @ApiProperty({ description: '상품 ID' })
  productId: string;

  @ApiProperty({ description: '상품명' })
  productName: string;

  @ApiProperty({ description: '상품 대표 이미지 URL' })
  productImageUrl: string;

  @ApiProperty({ description: '구매 수량' })
  quantity: number;

  @ApiProperty({ description: '송장번호', required: false })
  trackingNumber?: string;

  @ApiProperty({ description: '배송 주소' })
  shippingAddress: string;

  @ApiProperty({ description: '은행명', required: false })
  bankName?: string;

  @ApiProperty({ description: '계좌번호', required: false })
  accountNumber?: string;

  @ApiProperty({ description: '사용자 성명' })
  userName: string;

  @ApiProperty({ description: '구매일자' })
  purchaseDate: Date;

  @ApiProperty({ description: '주문 상태' })
  status: string;
}

export class UserPurchaseHistoryResponseDto extends PagedResponseV2<UserPurchaseHistoryItemDto> {}

