import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { QueryOrder, EntityManager } from '@mikro-orm/core';
import { QueryBuilder } from '@mikro-orm/postgresql';

import { BaseRepository } from '@/shared/common/base.repository';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { SellerRefundDateField } from '@/shared/enum/seller-refund-date-field.enum';
import { SellerRefundSearchField } from '@/shared/enum/seller-refund-search-field.enum';
import { RefundStatus } from '@/shared/enum/refund-status.enum';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { OrderService } from '@/module/order/order.service';
import { RefundStatusHistoryEntity } from './entity/refund-status-history.entity';
import { RefundStatusHistoryRepository } from './repository/refund-status-history.repository';
import { RefundStatusHistoryDto } from './dto/refund-status-history.dto';

import { SellerRefundListItemDto } from './dto/seller-refund-list-item.dto';
import { SellerRefundListRequestDto } from './dto/seller-refund-list-request.dto';
import { SellerRefundStatusUpdateDto } from './dto/seller-refund-status-update.dto';
import { RefundEntity } from './entity/refund.entity';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: BaseRepository<RefundEntity>,
    @InjectRepository(RefundStatusHistoryEntity)
    private readonly refundStatusHistoryRepository: RefundStatusHistoryRepository,
    private readonly em: EntityManager,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
  ) {}

  async findSellerRefundsPaged(
    sellerId: string,
    query: SellerRefundListRequestDto,
  ): Promise<PagedResponseV2<SellerRefundListItemDto>> {
    // Apply pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const where: any = { seller: { id: sellerId } };
    
    // Status filtering
    if (query.status) {
      where.status = query.status;
    }

    // Find refunds with all necessary relations populated
    const [refunds, total] = await this.refundRepository.findAndCount(where, {
      populate: ['product', 'buyer', 'orderItem', 'orderItem.order'],
      limit,
      offset,
      orderBy: { createdAt: QueryOrder.DESC },
    });

    // Map entities to DTOs - create plain objects to ensure proper serialization
    const items = refunds.map(refund => {
      // Parse option information from orderItem attributes
      let options: Array<{ name: string; quantity: number }> = [];
      
      if (refund.orderItem?.attributes) {
        try {
          const parsedAttributes = JSON.parse(refund.orderItem.attributes);
          
          // Handle multiple options
          if (Array.isArray(parsedAttributes)) {
            options = parsedAttributes.map(attr => ({
              name: attr.option || attr.name || '',
              quantity: attr.quantity || 1
            }));
          } else if (typeof parsedAttributes === 'object') {
            // Handle single option or object format
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
          }
        } catch (error) {
          // Keep empty array
        }
      }
      
      // Return plain object matching the interface
      return {
        id: refund.id,
        orderId: refund.orderItem?.order?.id || '',
        orderNumber: refund.orderItem?.order?.orderNumber || '',
        reason: refund.reason,
        status: refund.status,
        requestDate: refund.createdAt.toISOString(),
        customerName: refund.buyer?.name || 'N/A',
        productName: refund.product?.name || 'N/A',
        amount: refund.orderItem?.totalPrice || 0,
        options,
        // Additional fields for backward compatibility
        productImage: refund.product?.mainImage,
        quantity: refund.quantity,
        buyerId: refund.buyer?.id || 'N/A',
        buyerBankName: refund.buyer?.bankName,
        buyerAccountNumber: refund.buyer?.bankAccount,
        returnAddress: refund.returnAddress,
      };
    });

    // Use PagedResponseV2.create
    return PagedResponseV2.create(items, total, page, limit);
  }

  /**
   * 판매자가 특정 반품 요청의 상태를 변경합니다.
   * 상태 변경 시 메모를 추가할 수 있으며, 상태에 따라 적절한 후속 처리가 진행됩니다.
   */
  async updateRefundStatus(
    refundId: string,
    statusUpdateDto: SellerRefundStatusUpdateDto,
    seller: User,
  ): Promise<RefundEntity> {
    // 판매자 권한 확인
    if (seller.role !== UserRole.SELLER) {
      throw new ForbiddenException('판매자만 반품 상태를 변경할 수 있습니다.');
    }

    // 반품 정보 조회
    const refund = await this.refundRepository.findOne(
      {
        id: refundId,
        seller: { id: seller.id },
      },
      {
        populate: ['orderItem', 'orderItem.order'],
      },
    );

    if (!refund) {
      throw new NotFoundException(`ID가 ${refundId}인 반품 요청을 찾을 수 없습니다.`);
    }

    // 이미 완료 또는 거부된 반품은 상태 변경 불가
    if (refund.status === RefundStatus.COMPLETED || refund.status === RefundStatus.REJECTED) {
      throw new BadRequestException(
        `이미 ${refund.status === RefundStatus.COMPLETED ? '완료' : '거부'}된 반품은 상태를 변경할 수 없습니다.`,
      );
    }

    // 변경 불가능한 상태 조합 확인
    if (refund.status === RefundStatus.REQUESTED && statusUpdateDto.status === RefundStatus.COMPLETED) {
      throw new BadRequestException(
        '요청 상태에서 바로 완료 상태로 변경할 수 없습니다. 처리중 상태를 먼저 거쳐야 합니다.',
      );
    }

    // 이전 상태 저장
    const previousStatus = refund.status;

    // 상태 변경
    refund.status = statusUpdateDto.status;

    // 메모 추가
    if (statusUpdateDto.memo) {
      refund.statusMemo = statusUpdateDto.memo;
    }

    // 상태 변경 히스토리 생성
    const statusHistory = new RefundStatusHistoryEntity();
    statusHistory.refund = { id: refund.id } as RefundEntity;
    statusHistory.previousStatus = previousStatus;
    statusHistory.newStatus = statusUpdateDto.status;
    statusHistory.changedBy = { id: seller.id } as User;
    statusHistory.memo = statusUpdateDto.memo;

    // 히스토리 저장
    this.refundStatusHistoryRepository.persist(statusHistory);

    // 상태별 추가 처리
    switch (statusUpdateDto.status) {
      case RefundStatus.REQUESTED:
        // 반품 신청 상태로 변경 시 주문 상태를 REFUND_REQUESTED로 변경
        if (refund.orderItem?.order) {
          await this.orderService.markOrderAsRefundRequested(refund.orderItem.order.id);
        }
        break;

      case RefundStatus.PROCESSING:
        // 처리중으로 변경 시 특별한 처리 없음
        break;

      case RefundStatus.COMPLETED:
        // 완료 상태로 변경 시 관련 주문 상태도 변경 (REFUNDED)
        if (refund.orderItem?.order) {
          await this.orderService.markOrderAsRefunded(refund.orderItem.order.id);
        }
        break;

      case RefundStatus.REJECTED:
        // 거부 상태는 메모가 필수
        if (!statusUpdateDto.memo) {
          throw new BadRequestException('반품 거부 시에는 반드시 사유를 입력해야 합니다.');
        }
        break;
    }

    // 변경사항 저장
    await this.em.persistAndFlush(refund);

    return refund;
  }

  /**
   * 특정 반품의 상태 변경 히스토리를 조회합니다.
   * @param refundId 반품 ID
   * @param seller 요청한 판매자
   * @returns 상태 변경 히스토리 목록
   */
  async getRefundStatusHistory(refundId: string, seller: User): Promise<RefundStatusHistoryDto[]> {
    // 반품 정보 조회 (권한 확인)
    const refund = await this.refundRepository.findOne({
      id: refundId,
      seller: { id: seller.id },
    });

    if (!refund) {
      throw new NotFoundException(`ID가 ${refundId}인 반품 요청을 찾을 수 없습니다.`);
    }

    // 히스토리 조회
    const histories = await this.refundStatusHistoryRepository.findByRefundId(refundId);

    // DTO로 변환
    return histories.map((history) => {
      const dto = new RefundStatusHistoryDto();
      dto.id = history.id;
      dto.previousStatus = history.previousStatus;
      dto.newStatus = history.newStatus;
      dto.changedById = history.changedBy.id;
      dto.changedByName = history.changedBy.name;
      dto.memo = history.memo;
      dto.createdAt = history.createdAt;
      return dto;
    });
  }
}

