import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

import { RefundStatus } from '@/shared/enum/refund-status.enum';

import { RefundEntity } from '../entity/refund.entity';

// TODO: Product, User 엔티티에서 필요한 정보 타입 정의 필요 시 추가
interface ProductInfo {
  name: string;
  mainImage?: string;
}

interface BuyerInfo {
  id: string;
}

@Exclude()
export class SellerRefundListItemDto {
  @Expose()
  @ApiProperty({ description: '반품 ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: '주문 ID' })
  orderId: string;

  @Expose()
  @ApiProperty({ description: '주문 번호' })
  orderNumber: string;

  @Expose()
  @ApiProperty({ description: '반품 사유' })
  reason: string;

  @Expose()
  @ApiProperty({ description: '반품 상태', enum: RefundStatus })
  status: string;

  @Expose()
  @ApiProperty({ description: '반품 신청 일시' })
  requestDate: string;

  @Expose()
  @ApiProperty({ description: '고객명' })
  customerName: string;

  @Expose()
  @ApiProperty({ description: '상품명' })
  productName: string;

  @Expose()
  @ApiProperty({ description: '금액' })
  amount: number;

  @Expose()
  @ApiProperty({ 
    description: '선택한 옵션들', 
    example: [{ name: '사이즈 - L', quantity: 1 }, { name: '색상 - 빨강', quantity: 2 }],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        quantity: { type: 'number' }
      }
    },
    nullable: true 
  })
  options?: Array<{ name: string; quantity: number }>;

  // Additional fields for backward compatibility
  @ApiProperty({ description: '상품 대표 이미지 URL', nullable: true })
  productImage?: string;

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

  static fromEntity(refund: RefundEntity): SellerRefundListItemDto {
    const dto = new SellerRefundListItemDto();
    dto.id = refund.id;
    
    // Required fields for the interface
    dto.orderId = refund.orderItem?.order?.id ?? '';
    dto.orderNumber = refund.orderItem?.order?.orderNumber ?? '';
    dto.reason = refund.reason;
    dto.status = refund.status;
    dto.requestDate = refund.createdAt.toISOString();
    dto.customerName = refund.buyer?.name ?? 'N/A';
    dto.productName = refund.product?.name ?? 'N/A';
    dto.amount = refund.orderItem?.totalPrice ?? 0;
    
    // Parse option information from orderItem attributes
    if (refund.orderItem?.attributes) {
      try {
        const parsedAttributes = JSON.parse(refund.orderItem.attributes);
        
        // Handle multiple options
        if (Array.isArray(parsedAttributes)) {
          dto.options = parsedAttributes.map(attr => ({
            name: attr.option || attr.name || '',
            quantity: attr.quantity || 1
          }));
        } else if (typeof parsedAttributes === 'object') {
          // Handle single option or object format
          const options: Array<{ name: string; quantity: number }> = [];
          if (parsedAttributes.option || parsedAttributes.name) {
            options.push({
              name: parsedAttributes.option || parsedAttributes.name,
              quantity: parsedAttributes.quantity || refund.quantity
            });
          } else {
            // Handle key-value pairs as options
            Object.entries(parsedAttributes).forEach(([key, value]) => {
              options.push({
                name: `${key} - ${value}`,
                quantity: 1
              });
            });
          }
          dto.options = options;
        }
      } catch (error) {
        dto.options = [];
      }
    } else {
      dto.options = [];
    }
    
    // Additional fields
    dto.productImage = refund.product?.mainImage;
    dto.quantity = refund.quantity;
    dto.buyerId = refund.buyer?.id ?? 'N/A';
    dto.buyerBankName = refund.buyer?.bankName;
    dto.buyerAccountNumber = refund.buyer?.bankAccount;
    dto.returnAddress = refund.returnAddress;
    
    return dto;
  }
}
