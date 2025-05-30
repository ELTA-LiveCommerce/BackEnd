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
import { DepositStatus } from '@/shared/enum/deposit-status.enum';

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
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // OrderItem 기반으로 쿼리를 시작하여 해당 셀러의 상품만 조회
    const qb: QueryBuilder<OrderItem> = this.orderItemRepository
      .createQueryBuilder('oi')
      .select(['oi.*'])
      .leftJoinAndSelect('oi.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('oi.product', 'product')
      .leftJoinAndSelect('product.seller', 'seller')
      .where({ 'order.status': { $in: depositCompletedStatuses } })
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

    const total = await qb.clone().count();

    qb.orderBy({ 'order.createdAt': sortOrder.toUpperCase() as 'ASC' | 'DESC' })
      .offset(offset)
      .limit(limit);

    const orderItems = await qb.getResultList();

    const depositListItems = orderItems.map((orderItem) => {
      const item = new DepositListItemDto();
      const order = orderItem.order;
      item.id = orderItem.id; // OrderItem의 ID를 입금 ID로 사용
      item.orderId = order.id;
      item.orderNumber = order.orderNumber;
      item.amount = orderItem.totalPrice;
      item.status = order.status;
      item.customerName = order.user?.name ?? '고객명 없음';
      item.productName = orderItem.product?.name ?? '상품명 없음';
      item.createdAt = order.createdAt.toISOString();
      item.updatedAt = order.updatedAt.toISOString();
      return item;
    });

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
        // Items are already loaded as array, no need to init
        for (const item of order.items) {
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

        // if (order.status !== OrderStatus.PAID) {
        //   throw new BadRequestException(
        //     `주문 ID ${orderId}는 'PAID' 상태가 아니므로 입금 확인할 수 없습니다. 현재 상태: ${order.status}`,
        //   );
        // }

        await this.orderService._updateStatus(order, OrderStatus.PAID);
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

  async findAllBySeller(options: {
    page: number;
    limit: number;
    sellerId: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { page, limit, sellerId, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    const depositCompletedStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const qb: QueryBuilder<Order> = this.orderRepository
      .createQueryBuilder('order')
      .select(['order.*', 'user.*', 'seller.*'])
      .leftJoin('order.user', 'user')
      .leftJoin('order.items', 'oi')
      .leftJoin('oi.product', 'product')
      .leftJoin('product.seller', 'seller')
      .where({ status: { $in: depositCompletedStatuses } })
      .andWhere({ 'seller.id': sellerId });

    // 검색 기능 구현
    if (search) {
      const keyword = `%${search}%`;
      qb.andWhere({ 'product.name': { $like: keyword } });
    }

    const total = await qb.clone().count('order.id', true);

    // 정렬 기능 구현
    if (sortBy && sortOrder) {
      switch (sortBy) {
        case 'productName':
          qb.orderBy({ 'product.name': sortOrder.toUpperCase() as 'ASC' | 'DESC' });
          break;
        case 'quantity':
          qb.orderBy({ 'oi.quantity': sortOrder.toUpperCase() as 'ASC' | 'DESC' });
          break;
        case 'amount':
          qb.orderBy({ 'oi.totalPrice': sortOrder.toUpperCase() as 'ASC' | 'DESC' });
          break;
        case 'depositDate':
          qb.orderBy({ 'order.paidAt': sortOrder.toUpperCase() as 'ASC' | 'DESC' });
          break;
        default:
          qb.orderBy({ 'order.createdAt': sortOrder.toUpperCase() as 'ASC' | 'DESC' });
          break;
      }
    } else {
      qb.orderBy({ 'order.createdAt': 'DESC' });
    }

    qb.offset(offset).limit(limit);

    const orders = await qb.getResultList();
    await this.orderRepository.populate(orders, ['user', 'items', 'items.product', 'items.product.seller']);

    const deposits = orders.flatMap((order) =>
      order.items.getItems().map((orderItem) => {
        return {
          id: order.id,
          quantity: orderItem.quantity,
          amount: orderItem.totalPrice,
          depositedAt: order.paidAt || order.createdAt,
          status: order.status === OrderStatus.PAID ? DepositStatus.PENDING : DepositStatus.PROCESSING,
          product: {
            id: orderItem.product?.id || '',
            name: orderItem.product?.name || '상품명 없음',
            imageUrl: orderItem.product?.mainImage || '',
          },
          seller: {
            id: sellerId,
            name: orderItem.product?.seller?.name || '판매자 이름 없음',
          },
        };
      }),
    );

    return {
      deposits,
      total,
    };
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne(
      { id },
      {
        populate: ['user', 'items', 'items.product', 'items.product.seller'],
      },
    );

    if (!order) {
      throw new NotFoundException(`주문 ID ${id}를 찾을 수 없습니다.`);
    }

    const orderItem = order.items[0]; // 첫 번째 아이템만 사용 (개선 가능)

    if (!orderItem) {
      throw new NotFoundException(`주문 ID ${id}에 해당하는 상품이 없습니다.`);
    }

    return {
      id: order.id,
      quantity: orderItem.quantity,
      amount: orderItem.totalPrice,
      depositedAt: order.paidAt || order.createdAt,
      status: this.mapOrderStatusToDepositStatus(order.status),
      product: {
        id: orderItem.product?.id || '',
        name: orderItem.product?.name || '상품명 없음',
        imageUrl: orderItem.product?.mainImage || '',
      },
      seller: {
        id: orderItem.product?.seller?.id || '',
        name: orderItem.product?.seller?.name || '판매자 이름 없음',
      },
    };
  }

  async updateStatus(id: string, status: DepositStatus) {
    const order = await this.orderRepository.findOne(
      { id },
      {
        populate: ['user', 'items', 'items.product', 'items.product.seller'],
      },
    );

    if (!order) {
      throw new NotFoundException(`주문 ID ${id}를 찾을 수 없습니다.`);
    }

    const orderStatus = this.mapDepositStatusToOrderStatus(status, order.status);
    order.status = orderStatus;

    // 상태에 따른 추가 정보 업데이트
    if (status === DepositStatus.COMPLETED && !order.paidAt) {
      order.paidAt = new Date();
    }

    await this.orderRepository.flush();

    const orderItem = order.items[0]; // 첫 번째 아이템만 사용 (개선 가능)

    return {
      id: order.id,
      quantity: orderItem.quantity,
      amount: orderItem.totalPrice,
      depositedAt: order.paidAt || order.createdAt,
      status,
      product: {
        id: orderItem.product?.id || '',
        name: orderItem.product?.name || '상품명 없음',
        imageUrl: orderItem.product?.mainImage || '',
      },
      seller: {
        id: orderItem.product?.seller?.id || '',
        name: orderItem.product?.seller?.name || '판매자 이름 없음',
      },
    };
  }

  // 헬퍼 메소드: OrderStatus를 DepositStatus로 변환
  private mapOrderStatusToDepositStatus(orderStatus: OrderStatus): DepositStatus {
    switch (orderStatus) {
      case OrderStatus.PENDING:
        return DepositStatus.PENDING;
      case OrderStatus.PAID:
        return DepositStatus.PENDING; // 입금은 완료되었지만 아직 처리 전
      case OrderStatus.PROCESSING:
        return DepositStatus.PROCESSING;
      case OrderStatus.SHIPPED:
      case OrderStatus.DELIVERED:
        return DepositStatus.COMPLETED;
      case OrderStatus.CANCELLED:
        return DepositStatus.REJECTED;
      case OrderStatus.REFUNDED:
        return DepositStatus.FAILED;
      default:
        return DepositStatus.PENDING;
    }
  }

  // 헬퍼 메소드: DepositStatus를 OrderStatus로 변환
  private mapDepositStatusToOrderStatus(depositStatus: DepositStatus, currentOrderStatus: OrderStatus): OrderStatus {
    switch (depositStatus) {
      case DepositStatus.PENDING:
        return OrderStatus.PAID;
      case DepositStatus.PROCESSING:
        return OrderStatus.PROCESSING;
      case DepositStatus.COMPLETED:
        // 이미 배송 중이나 배송 완료 상태라면 그대로 유지
        if (currentOrderStatus === OrderStatus.SHIPPED || currentOrderStatus === OrderStatus.DELIVERED) {
          return currentOrderStatus;
        }
        return OrderStatus.PROCESSING;
      case DepositStatus.REJECTED:
        return OrderStatus.CANCELLED;
      case DepositStatus.FAILED:
        return OrderStatus.REFUNDED;
      default:
        return currentOrderStatus;
    }
  }
}

