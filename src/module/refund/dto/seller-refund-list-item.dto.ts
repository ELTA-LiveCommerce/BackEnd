import { ApiProperty } from '@nestjs/swagger';

import { RefundStatus } from '@/shared/enum/refund-status.enum';

import { Refund } from '../entity/refund.entity';

// TODO: Product, User 엔티티에서 필요한 정보 타입 정의 필요 시 추가
interface ProductInfo {
  name: string;
  mainImage?: string;
}

interface BuyerInfo {
  id: string;
}

export class SellerRefundListItemDto {
  @ApiProperty({ description: '반품 ID' })
  id: string;

  @ApiProperty({ description: '상품 대표 이미지 URL', nullable: true })
  productImage?: string;

  @ApiProperty({ description: '상품명' })
  productName: string;

  @ApiProperty({ description: '반품 수량' })
  quantity: number;

  @ApiProperty({ description: '구매자 ID' })
  buyerId: string;

  @ApiProperty({ description: '구매자 은행명', nullable: true })
  buyerBankName?: string;

  @ApiProperty({ description: '구매자 계좌번호', nullable: true })
  buyerAccountNumber?: string;

  @ApiProperty({ description: '회수지 주소' })
  returnAddress: string;

  @ApiProperty({ description: '반품 사유' })
  reason: string;

  @ApiProperty({ description: '반품 상태', enum: RefundStatus })
  status: RefundStatus;

  @ApiProperty({ description: '반품 신청 일시' })
  requestedAt: Date;

  static fromEntity(refund: Refund): SellerRefundListItemDto {
    const dto = new SellerRefundListItemDto();
    dto.id = refund.id;
    // Assuming product and buyer are populated or loaded
    dto.productImage = refund.product?.mainImage; // Requires product relation to be loaded
    dto.productName = refund.product?.name ?? 'N/A'; // Requires product relation
    dto.quantity = refund.quantity;
    dto.buyerId = refund.buyer?.id ?? 'N/A'; // Requires buyer relation
    dto.buyerBankName = refund.buyerBankName;
    dto.buyerAccountNumber = refund.buyerAccountNumber;
    dto.returnAddress = refund.returnAddress;
    dto.reason = refund.reason;
    dto.status = refund.status;
    dto.requestedAt = refund.createdAt; // Use createdAt from BaseEntity
    return dto;
  }
}
