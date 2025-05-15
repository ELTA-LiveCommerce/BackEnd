import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { QueryOrder, EntityManager } from '@mikro-orm/core';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { Transactional } from '@nestjs-cls/transactional';

import { BaseRepository } from '@/shared/common/base.repository';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { SellerRefundDateField } from '@/shared/enum/seller-refund-date-field.enum';
import { SellerRefundSearchField } from '@/shared/enum/seller-refund-search-field.enum';

import { SellerRefundListItemDto } from './dto/seller-refund-list-item.dto';
import { SellerRefundListRequestDto } from './dto/seller-refund-list-request.dto';
import { RefundEntity } from './entity/refund.entity';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: BaseRepository<RefundEntity>,
  ) {}

  @Transactional()
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
}
