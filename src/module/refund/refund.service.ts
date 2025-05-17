import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

import { SellerRefundListItemDto } from './dto/seller-refund-list-item.dto';
import { SellerRefundListRequestDto } from './dto/seller-refund-list-request.dto';
import { SellerRefundStatusUpdateDto } from './dto/seller-refund-status-update.dto';
import { RefundEntity } from './entity/refund.entity';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: BaseRepository<RefundEntity>,
    private readonly em: EntityManager,
  ) {}

  async findSellerRefundsPaged(
    sellerId: string,
    query: SellerRefundListRequestDto,
  ): Promise<PagedResponseV2<SellerRefundListItemDto>> {
    const qb = this.refundRepository
      .createQueryBuilder('r')
      .select([
        'r.id',
        'r.quantity',
        'r.reason',
        'r.status',
        'r.buyerBankName',
        'r.buyerAccountNumber',
        'r.returnAddress',
        'r.createdAt', // For requestedAt field in DTO
        'p.name as productName', // Alias for product name
        'p.mainImage as productImage', // Alias for product image
        'b.id as buyerId', // Alias for buyer ID
      ])
      .leftJoin('r.product', 'p') // Join with Product
      .leftJoin('r.buyer', 'b') // Join with User (buyer)
      .where({ seller: { id: sellerId } });

    // Status filtering
    if (query.status) {
      qb.andWhere({ status: query.status });
    }

    // Dynamic search keyword filtering
    if (query.searchKeyword) {
      switch (query.searchField) {
        case SellerRefundSearchField.PRODUCT_NAME:
          qb.andWhere({ 'p.name': { $like: `%${query.searchKeyword}%` } });
          break;
        case SellerRefundSearchField.BUYER_ID:
          qb.andWhere({ 'b.id': { $like: `%${query.searchKeyword}%` } });
          break;
        case SellerRefundSearchField.REASON:
          qb.andWhere({ 'r.reason': { $like: `%${query.searchKeyword}%` } });
          break;
      }
    }

    // Dynamic date range filtering
    const dateField = query.dateField === SellerRefundDateField.UPDATED_AT ? 'r.updatedAt' : 'r.createdAt';
    if (query.startDate) {
      qb.andWhere({ [`${dateField} >=`]: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere({ [`${dateField} <=`]: query.endDate });
    }

    // Apply pagination
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    // Apply sorting
    qb.orderBy({ [dateField]: QueryOrder.DESC });

    // Clone for count query before applying limit/offset
    const countQb = qb.clone().count('r.id', true);
    qb.limit(limit).offset(offset);

    const [refundMaps, totalResult] = await Promise.all([
      qb.getResult(), // Use getResult() for maps
      countQb.execute('get'),
    ]);
    const total = totalResult.count;

    // Map raw results to DTOs (manual mapping due to aliases)
    const items = refundMaps.map((map: any) => {
      const dto = new SellerRefundListItemDto();
      dto.id = map.id;
      dto.productImage = map.productImage;
      dto.productName = map.productName;
      dto.quantity = map.quantity;
      dto.buyerId = map.buyerId;
      dto.buyerBankName = map.buyerBankName;
      dto.buyerAccountNumber = map.buyerAccountNumber;
      dto.returnAddress = map.returnAddress;
      dto.reason = map.reason;
      dto.status = map.status;
      dto.requestedAt = map.createdAt;
      return dto;
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

    // 상태 변경
    refund.status = statusUpdateDto.status;

    // 메모 추가
    if (statusUpdateDto.memo) {
      refund.statusMemo = statusUpdateDto.memo;
    }

    // 상태별 추가 처리
    switch (statusUpdateDto.status) {
      case RefundStatus.PROCESSING:
        // 처리중으로 변경 시 특별한 처리 없음
        break;

      case RefundStatus.COMPLETED:
        // 완료 상태로 변경 시 관련 주문 상태도 변경 (REFUNDED)
        if (refund.orderItem?.order) {
          refund.orderItem.order.status = OrderStatus.REFUNDED;
          await this.em.persistAndFlush(refund.orderItem.order);
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
}

