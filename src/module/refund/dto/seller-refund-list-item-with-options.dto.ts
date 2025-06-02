import { ApiProperty } from '@nestjs/swagger';

import { RefundStatus } from '@/shared/enum/refund-status.enum';

import { RefundEntity } from '../entity/refund.entity';

// Option information interface
interface OptionInfo {
  name: string;
  value: string;
}

export class SellerRefundListItemWithOptionsDto {
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

  @ApiProperty({ description: '주문 ID' })
  orderId: string;

  @ApiProperty({ description: '주문 번호' })
  orderNumber: string;

  @ApiProperty({ description: '주문 항목 ID' })
  orderItemId: string;

  @ApiProperty({ description: '구매자 이름' })
  customerName: string;

  @ApiProperty({ description: '환불 금액' })
  amount: number;

  @ApiProperty({ 
    description: '상품 옵션 정보', 
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'string' }
      }
    },
    isArray: true,
    nullable: true 
  })
  options?: OptionInfo[];

  @ApiProperty({ description: '관리자 메모', nullable: true })
  adminMemo?: string;

  @ApiProperty({ description: '상태 변경 메모', nullable: true })
  statusMemo?: string;

  static fromEntity(refund: RefundEntity): SellerRefundListItemWithOptionsDto {
    const dto = new SellerRefundListItemWithOptionsDto();
    dto.id = refund.id;
    
    // Product information
    dto.productImage = refund.product?.mainImage;
    dto.productName = refund.product?.name ?? 'N/A';
    
    // Refund details
    dto.quantity = refund.quantity;
    dto.reason = refund.reason;
    dto.status = refund.status;
    dto.requestedAt = refund.createdAt;
    dto.returnAddress = refund.returnAddress;
    
    // Buyer information
    dto.buyerId = refund.buyer?.id ?? 'N/A';
    dto.customerName = refund.buyer?.name ?? 'N/A';
    dto.buyerBankName = refund.buyer?.bankName;
    dto.buyerAccountNumber = refund.buyer?.bankAccount;
    
    // Order information
    dto.orderItemId = refund.orderItem?.id ?? 'N/A';
    dto.orderId = refund.orderItem?.order?.id ?? 'N/A';
    dto.orderNumber = refund.orderItem?.order?.orderNumber ?? 'N/A';
    
    // Calculate refund amount
    dto.amount = refund.orderItem?.totalPrice ?? 0;
    
    // Parse options from orderItem attributes
    if (refund.orderItem?.attributes) {
      try {
        const parsedAttributes = JSON.parse(refund.orderItem.attributes);
        dto.options = Array.isArray(parsedAttributes) 
          ? parsedAttributes 
          : Object.entries(parsedAttributes).map(([name, value]) => ({
              name,
              value: String(value)
            }));
      } catch (error) {
        // If parsing fails, return empty options
        dto.options = [];
      }
    }
    
    // Additional memo fields
    dto.adminMemo = refund.adminMemo;
    dto.statusMemo = refund.statusMemo;
    
    return dto;
  }

  static fromEntities(refunds: RefundEntity[]): SellerRefundListItemWithOptionsDto[] {
    return refunds.map(refund => this.fromEntity(refund));
  }
}