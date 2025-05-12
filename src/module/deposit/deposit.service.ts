import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository, MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityRepository, QueryBuilder } from '@mikro-orm/postgresql';
import { wrap } from '@mikro-orm/core';
import { Transactional } from '@nestjs-cls/transactional';

import { SellerDepositListRequestDto } from '@/api/v2/seller/deposit/deposit.request.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Order } from '@/module/order/entity/order.entity';
import { DepositListItemDto } from './dto/deposit-list-item.dto';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { Delivery } from '../delivery/entity/delivery.entity';
import { SellerDepositSearchField } from '@/api/v2/seller/deposit/deposit-search-field.enum';
import { SellerDepositDateField } from '@/api/v2/seller/deposit/deposit-date-field.enum';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { OrderService } from '../order/order.service';

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: EntityRepository<OrderItem>,
    private readonly orderService: OrderService,
  ) {}

  async findSellerDepositsPaged(
    sellerId: string,
    query: SellerDepositListRequestDto,
  ): Promise<PagedResponseV2<DepositListItemDto>> {
    const {
      page = 1,
      limit = 10,
      searchField,
      searchKeyword,
      dateField,
      startDate,
      endDate,
      sortOrder = 'desc',
    } = query;
    const offset = (page - 1) * limit;

    const depositCompletedStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const qb: QueryBuilder<Order> = this.orderRepository
      .createQueryBuilder('order')
      .select(['order.*, user.*, oi.*, product.*', 'seller.*'])
      .leftJoin('order.user', 'user')
      .leftJoin('order.items', 'oi')
      .leftJoin('oi.product', 'product')
      .leftJoin('product.seller', 'seller')
      .where({ status: { $in: depositCompletedStatuses } })
      .andWhere({ 'seller.id': sellerId });

    if (searchField && searchKeyword) {
      const keyword = `%${searchKeyword}%`;
      switch (searchField) {
        case SellerDepositSearchField.PRODUCT_NAME:
          qb.andWhere({ 'product.name': { $like: keyword } });
          break;
        case SellerDepositSearchField.BUYER_ID:
          qb.andWhere({ 'user.loginId': { $like: keyword } });
          break;
        case SellerDepositSearchField.ORDER_NUMBER:
          qb.andWhere({ 'order.orderNumber': { $like: keyword } });
          break;
      }
    }

    if (dateField === SellerDepositDateField.ORDER_CREATED_AT && startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      qb.andWhere({ createdAt: { $gte: new Date(startDate), $lte: endOfDay } });
    }

    const total = await qb.clone().count('order.id', true);

    qb.orderBy({ createdAt: sortOrder.toUpperCase() as 'ASC' | 'DESC' })
      .offset(offset)
      .limit(limit);

    const orders = await qb.getResultList();

    const depositListItems = orders.flatMap((order) =>
      order.items.getItems().map((orderItem) => {
        const item = new DepositListItemDto();
        item.orderId = order.id;
        item.productMainImage = orderItem.product?.mainImage ?? null;
        item.productName = orderItem.product?.name ?? '상품명 없음';
        item.quantity = orderItem.quantity;
        item.buyerBankName = order.user?.bankName ?? null;
        item.buyerAccount = order.user?.accountNumber ?? null;
        item.buyerLoginId = order.user?.loginId ?? '아이디 없음';
        item.buyerPhoneNumber = order.user?.phoneNumber ?? null;
        item.buyerAddress = order.shippingAddress ?? '주소 정보 없음';
        item.orderStatus = order.status;
        item.createdAt = order.createdAt;
        return item;
      }),
    );

    return PagedResponseV2.create(depositListItems, total, page, limit);
  }

  // @Transactional() // Temporarily disable for unit testing
  async confirmDeposits(sellerId: string, orderIds: string[]): Promise<void> {
    const errors: { orderId: string; message: string }[] = [];

    for (const orderId of orderIds) {
      try {
        const order = await this.orderService._findOrderById(orderId);

        if (!order) {
          throw new NotFoundException(`주문 ID ${orderId}를 찾을 수 없습니다.`);
        }

        // Check if the order belongs to the seller using a standard loop for async compatibility
        let isSellerOrder = false;
        await wrap(order.items).init(); // Ensure items are loaded before looping
        for (const item of order.items.getItems()) {
          await wrap(item.product).init();
          await wrap(item.product?.seller)?.init();
          if (item.product?.seller?.id === sellerId) {
            isSellerOrder = true;
            break; // Found one item belonging to the seller, no need to check further
          }
        }

        if (!isSellerOrder) {
          throw new ForbiddenException(`주문 ID ${orderId}에 대한 권한이 없습니다.`);
        }

        if (order.status !== OrderStatus.PAID) {
          throw new BadRequestException(
            `주문 ID ${orderId}는 'PAID' 상태가 아니므로 입금 확인할 수 없습니다. 현재 상태: ${order.status}`,
          );
        }

        await this.orderService._updateStatus(order, OrderStatus.PROCESSING);
      } catch (error) {
        errors.push({ orderId, message: error.message || 'Unknown error' });
      }
    }

    if (errors.length > 0) {
      console.error('입금 확인 처리 중 오류 발생:', errors);
      throw new BadRequestException(
        `다음 주문들의 입금 확인 처리에 실패했습니다: ${errors.map((e) => e.orderId).join(', ')}. 세부 정보: ${JSON.stringify(errors)}`,
      );
    }
  }
}
