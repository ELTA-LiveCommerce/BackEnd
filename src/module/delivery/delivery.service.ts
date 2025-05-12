import { EntityRepository, Reference, Loaded } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { QueryOrderMap } from '@mikro-orm/core';

import { UserRole } from '@/shared/enum/user-role.enum';

import { CreateDeliveryAutoDto } from './dto/create-delivery-auto.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { SearchDeliveryDto } from './dto/search-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Delivery, DeliveryStatus } from './entity/delivery.entity';
import { Order } from '../order/entity/order.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { SellerDeliveryListRequestDto } from '@/api/v2/seller/delivery/delivery.request.dto';
import { SellerDeliverySearchField } from '@/api/v2/seller/delivery/delivery-search-field.enum';
import { SellerDeliveryDateField } from '@/api/v2/seller/delivery/delivery-date-field.enum';
import { OrderItem } from '@/module/order/entity/order-item.entity';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: EntityRepository<Delivery>,
    private readonly entityManager: SqlEntityManager,
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: EntityRepository<OrderItem>,
  ) {}

  /**
   * 주문 생성 시 자동으로 배송 정보를 생성합니다.
   */
  async createDelivery(createDeliveryAutoDto: CreateDeliveryAutoDto): Promise<Delivery> {
    // 주문 확인
    const order = await this.entityManager.findOne(Order, { id: createDeliveryAutoDto.orderId });
    if (!order) {
      throw new NotFoundException(`Order with ID ${createDeliveryAutoDto.orderId} not found`);
    }

    // 판매자 확인
    const seller = await this.entityManager.findOne(User, { id: createDeliveryAutoDto.sellerId });
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${createDeliveryAutoDto.sellerId} not found`);
    }

    // 배송 객체 생성
    const delivery = new Delivery();
    delivery.order = order;
    delivery.seller = seller;
    delivery.status = DeliveryStatus.PREPARING;
    delivery.recipientName = createDeliveryAutoDto.recipientName;
    delivery.recipientPhoneNumber = createDeliveryAutoDto.recipientPhoneNumber;
    delivery.address = createDeliveryAutoDto.address;

    // 상품이 여러 개인 경우 대표 상품으로 첫 번째 상품을 설정
    if (createDeliveryAutoDto.productIds.length > 0) {
      const product = await this.entityManager.findOne(Product, { id: createDeliveryAutoDto.productIds[0] });
      if (product) {
        this.logger.debug(`Representative product ${product.id} found for delivery, but not directly linked.`);
      }
    }

    await this.entityManager.persistAndFlush(delivery);
    return delivery;
  }

  /**
   * 판매자가 주문에 대한 배송 정보를 생성합니다.
   */
  async create(createDeliveryDto: CreateDeliveryDto, user: User): Promise<Delivery> {
    // 주문 확인
    const order = await this.entityManager.findOne(Order, { id: createDeliveryDto.orderId }, { populate: ['items'] });
    if (!order) {
      throw new NotFoundException(`Order with ID ${createDeliveryDto.orderId} not found`);
    }

    // 상품 확인
    // const product = await this.entityManager.findOne(Product, { id: createDeliveryDto.productId });
    // if (!product) {
    //   throw new NotFoundException(`Product with ID ${createDeliveryDto.productId} not found`);
    // }

    // 판매자 권한 확인
    // const isSellerProduct = order.items
    //   .getItems()
    //   .some((item) => item.product?.id === createDeliveryDto.productId && item.product?.seller?.id === user.id);
    // if (!isSellerProduct && user.role !== UserRole.ADMIN) {
    //   throw new ForbiddenException('You do not have permission to create delivery for this order');
    // }

    const delivery = new Delivery();
    delivery.order = order;
    // delivery.product = product; // 제거
    delivery.seller = user;
    delivery.status = createDeliveryDto.status || DeliveryStatus.PREPARING;
    delivery.trackingNumber = createDeliveryDto.trackingNumber;
    delivery.courierCompany = createDeliveryDto.courierCompany;
    delivery.recipientName = createDeliveryDto.recipientName;
    delivery.recipientPhoneNumber = createDeliveryDto.recipientPhoneNumber;
    delivery.address = createDeliveryDto.address;

    // 배송 상태에 따라 날짜 설정
    if (delivery.status === DeliveryStatus.SHIPPING) {
      delivery.shippedAt = new Date();
    } else if (delivery.status === DeliveryStatus.DELIVERED) {
      delivery.deliveredAt = new Date();
    } else if (delivery.status === DeliveryStatus.CANCELED) {
      delivery.canceledAt = new Date();
    }

    await this.entityManager.persistAndFlush(delivery);
    return delivery;
  }

  /**
   * 모든 배송 정보를 조회합니다.
   * 판매자는 자신의 상품에 대한 배송만 조회 가능합니다.
   */
  async findAll(user: User): Promise<Delivery[]> {
    if (user.role === UserRole.ADMIN) {
      return this.deliveryRepository.findAll({
        populate: ['order', 'order.user', 'seller'],
      });
    }

    // 판매자인 경우 자신의 상품 배송만 조회
    return this.deliveryRepository.find({ seller: user }, { populate: ['order', 'order.user', 'seller'] });
  }

  /**
   * 배송 정보를 검색합니다.
   * 키워드, 상태, 기간으로 필터링할 수 있습니다.
   */
  async search(searchDto: SearchDeliveryDto, user: User): Promise<Delivery[]> {
    const where: any = {};

    // 판매자인 경우 자신의 상품 배송만 조회 가능
    if (user.role !== UserRole.ADMIN) {
      where.seller = user;
    }

    // 배송 상태로 필터링
    if (searchDto.status) {
      where.status = searchDto.status;
    }

    // 날짜 범위로 필터링
    const dateFilter: any = {};
    if (searchDto.startDate) {
      dateFilter.gte = searchDto.startDate;
    }
    if (searchDto.endDate) {
      dateFilter.lte = searchDto.endDate;
      // 종료일은 해당일의 마지막 시간(23:59:59)까지 포함
      dateFilter.lte.setHours(23, 59, 59, 999);
    }

    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    // 키워드 검색을 위해 수동으로 쿼리를 작성
    const qb = this.entityManager.createQueryBuilder(Delivery, 'd');
    qb.where(where)
      .leftJoinAndSelect('d.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('d.seller', 'seller')
      .orderBy({ 'd.createdAt': 'DESC' });

    // 키워드 검색
    if (searchDto.keyword) {
      qb.andWhere('(user.username LIKE :keyword OR user.name LIKE :keyword OR d.trackingNumber LIKE :keyword)', {
        keyword: `%${searchDto.keyword}%`,
      } as any);
    }

    return qb.getResult();
  }

  /**
   * 특정 주문의 배송 정보를 조회합니다.
   */
  async findByOrder(orderId: string, user: User): Promise<Delivery[]> {
    const order = await this.entityManager.findOne(
      Order,
      { id: orderId },
      { populate: ['items.product.seller', 'user'] },
    );
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // 관리자가 아닌 경우, 자신의 주문 또는 판매한 상품의 배송만 볼 수 있음
    if (user.role !== UserRole.ADMIN) {
      const isBuyer = order.user?.id === user.id;
      const isSeller = order.items.getItems().some((item) => item.product?.seller?.id === user.id);

      if (!isBuyer && !isSeller) {
        throw new ForbiddenException('You do not have permission to view this delivery information');
      }
    }

    return this.deliveryRepository.find({ order }, { populate: ['order', 'order.user', 'seller'] });
  }

  /**
   * ID로 배송 정보를 조회합니다.
   */
  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ id }, { populate: ['order', 'order.user', 'seller'] });

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }

    return delivery;
  }

  /**
   * 배송 정보를 업데이트합니다.
   */
  async update(id: string, updateDeliveryDto: UpdateDeliveryDto, user: User): Promise<Delivery> {
    const delivery = await this.findOne(id);

    // 판매자 권한 확인
    if (delivery.seller.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this delivery information');
    }

    // 배송 상태 업데이트 시 날짜 자동 설정
    if (updateDeliveryDto.status) {
      if (updateDeliveryDto.status === DeliveryStatus.SHIPPING && delivery.status !== DeliveryStatus.SHIPPING) {
        delivery.shippedAt = new Date();
      } else if (
        updateDeliveryDto.status === DeliveryStatus.DELIVERED &&
        delivery.status !== DeliveryStatus.DELIVERED
      ) {
        delivery.deliveredAt = new Date();
      } else if (updateDeliveryDto.status === DeliveryStatus.CANCELED && delivery.status !== DeliveryStatus.CANCELED) {
        delivery.canceledAt = new Date();
      }
    }

    // assign 메서드로 객체 복사 (MikroORM 방식)
    this.entityManager.assign(delivery, updateDeliveryDto);
    await this.entityManager.flush();

    return delivery;
  }

  /**
   * 배송 정보를 삭제합니다.
   */
  async remove(id: string, user: User): Promise<void> {
    const delivery = await this.findOne(id);

    // 판매자 권한 확인
    if (delivery.seller.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this delivery information');
    }

    await this.deliveryRepository.nativeDelete({ id });
  }

  /**
   * 배송 상태 일괄 변경
   */
  async updateStatus(ids: string[], status: DeliveryStatus, user: User): Promise<void> {
    // 배송 정보 조회
    const deliveries = await this.deliveryRepository.find({ id: { $in: ids } });

    if (deliveries.length === 0) {
      throw new NotFoundException('선택한 배송 정보를 찾을 수 없습니다');
    }

    // 모든 배송이 해당 판매자/관리자의 것인지 확인
    const hasPermission = deliveries.every(
      (delivery) => delivery.seller.id === user.id || user.role === UserRole.ADMIN,
    );

    if (!hasPermission) {
      throw new ForbiddenException('일부 배송 정보에 대한 수정 권한이 없습니다');
    }

    // 상태 및 날짜 업데이트
    const now = new Date();
    for (const delivery of deliveries) {
      delivery.status = status;

      // 상태에 따른 날짜 업데이트
      if (status === DeliveryStatus.SHIPPING) {
        delivery.shippedAt = now;
      } else if (status === DeliveryStatus.DELIVERED) {
        delivery.deliveredAt = now;
      } else if (status === DeliveryStatus.CANCELED) {
        delivery.canceledAt = now;
      }
    }

    await this.entityManager.flush();
  }

  async findSellerDeliveriesPaged(
    sellerId: string,
    query: SellerDeliveryListRequestDto,
  ): Promise<{
    items: {
      delivery: Loaded<Delivery, 'order.user'>;
      orderItem: Loaded<OrderItem, 'product'> | null;
      order: Loaded<Order, 'user' | 'items.product'>;
    }[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    // Use EntityManager's QueryBuilder
    const qb = this.entityManager.createQueryBuilder(Delivery, 'd');

    qb.select('*')
      .leftJoinAndSelect('d.order', 'o')
      .leftJoinAndSelect('o.user', 'u')
      .leftJoinAndSelect('o.items', 'oi')
      .leftJoinAndSelect('oi.product', 'p')
      .where({ seller: sellerId });

    // Dynamic keyword search
    if (query.searchKeyword && query.searchField) {
      const keyword = `%${query.searchKeyword}%`;
      switch (query.searchField) {
        case SellerDeliverySearchField.PRODUCT_NAME:
          qb.andWhere({ 'p.name': { $like: keyword } });
          break;
        case SellerDeliverySearchField.RECIPIENT_NAME:
          qb.andWhere({ recipientName: { $like: keyword } });
          break;
        case SellerDeliverySearchField.ORDER_ID:
          // Make sure to compare against the correct field if order ID is not UUID
          qb.andWhere({ 'o.id': { $like: keyword } });
          break;
        case SellerDeliverySearchField.BUYER_NAME:
          qb.andWhere({ 'u.name': { $like: keyword } });
          break;
        case SellerDeliverySearchField.TRACKING_NUMBER:
          qb.andWhere({ trackingNumber: { $like: keyword } });
          break;
      }
    }

    // Dynamic date range filter
    const dateColumn = this.getDateColumn(query.dateField);
    if (dateColumn && (query.startDate || query.endDate)) {
      const dateConditions: any = {};
      if (query.startDate) {
        dateConditions.$gte = query.startDate;
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateConditions.$lte = endDate;
      }
      if (Object.keys(dateConditions).length > 0) {
        qb.andWhere({ [dateColumn]: dateConditions });
      }
    }

    // Sorting
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const sortColumn = this.getDateColumn(query.dateField) ?? 'o.createdAt'; // Use date field for sorting if specified
    qb.orderBy({ [sortColumn]: sortOrder });

    // Pagination
    qb.limit(limit).offset(offset);

    // Execute queries lecithin and count separately
    const deliveries = await qb.getResultList();
    const total = await qb
      .clone()
      .count()
      .execute('get')
      .then((res) => res.count); // Clone for count query

    // Map results. Relations are already loaded due to leftJoinAndSelect.
    const itemsWithDetails = deliveries.map((delivery) => {
      // delivery.order should be Loaded<Order, 'user' | 'items.product'>
      const order = delivery.order; // Direct access, no need for isInitialized or load
      // Find the first orderItem (assuming one item per delivery for now)
      const orderItem = order.items.getItems()[0] ?? null;

      return {
        delivery: delivery as Loaded<Delivery, 'order.user'>,
        orderItem: orderItem as Loaded<OrderItem, 'product'> | null,
        order: order as Loaded<Order, 'user' | 'items.product'>,
      };
    });

    return {
      items: itemsWithDetails,
      total,
      page,
      limit,
    };
  }

  private getDateColumn(dateField?: SellerDeliveryDateField): string | null {
    switch (dateField) {
      case SellerDeliveryDateField.ORDER_DATE:
        return 'o.createdAt';
      case SellerDeliveryDateField.PAYMENT_DATE:
        return 'o.paidAt';
      case SellerDeliveryDateField.DELIVERY_START_DATE:
        return 'd.shippedAt';
      case SellerDeliveryDateField.DELIVERY_COMPLETED_DATE:
        return 'd.deliveredAt';
      default:
        return 'o.createdAt'; // Default sort/filter by order date
    }
  }
}
