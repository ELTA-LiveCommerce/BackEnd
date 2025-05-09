import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';

import { CreateDeliveryAutoDto } from './dto/create-delivery-auto.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { SearchDeliveryDto } from './dto/search-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Delivery, DeliveryStatus } from './entity/delivery.entity';
import { Order } from '../order/entity/order.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: EntityRepository<Delivery>,
    private readonly entityManager: SqlEntityManager,
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
    delivery.shippingAddress = createDeliveryAutoDto.shippingAddress;

    // 상품이 여러 개인 경우 대표 상품으로 첫 번째 상품을 설정
    if (createDeliveryAutoDto.productIds.length > 0) {
      const product = await this.entityManager.findOne(Product, { id: createDeliveryAutoDto.productIds[0] });
      if (product) {
        delivery.product = product;
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
    const product = await this.entityManager.findOne(Product, { id: createDeliveryDto.productId });
    if (!product) {
      throw new NotFoundException(`Product with ID ${createDeliveryDto.productId} not found`);
    }

    // 판매자 권한 확인
    const isSellerProduct = order.items
      .getItems()
      .some((item) => item.product?.id === createDeliveryDto.productId && item.product?.seller?.id === user.id);
    if (!isSellerProduct && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to create delivery for this order');
    }

    const delivery = new Delivery();
    delivery.order = order;
    delivery.product = product;
    delivery.seller = user;
    delivery.status = createDeliveryDto.status || DeliveryStatus.PREPARING;
    delivery.trackingNumber = createDeliveryDto.trackingNumber;
    delivery.courierCompany = createDeliveryDto.courierCompany;
    delivery.shippingAddress = createDeliveryDto.shippingAddress;

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
        populate: ['order', 'order.items', 'order.user', 'product', 'seller'],
      });
    }

    // 판매자인 경우 자신의 상품 배송만 조회
    return this.deliveryRepository.find(
      { seller: user },
      { populate: ['order', 'order.items', 'order.user', 'product', 'seller'] },
    );
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
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('d.product', 'product')
      .leftJoinAndSelect('d.seller', 'seller')
      .orderBy({ 'd.createdAt': 'DESC' });

    // 키워드 검색
    if (searchDto.keyword) {
      qb.andWhere(
        '(product.name LIKE :keyword OR user.username LIKE :keyword OR user.name LIKE :keyword OR d.trackingNumber LIKE :keyword)',
        { keyword: `%${searchDto.keyword}%` },
      );
    }

    return qb.getResult();
  }

  /**
   * 특정 주문의 배송 정보를 조회합니다.
   */
  async findByOrder(orderId: string, user: User): Promise<Delivery[]> {
    const order = await this.entityManager.findOne(Order, { id: orderId }, { populate: ['items'] });
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

    return this.deliveryRepository.find(
      { order },
      { populate: ['order', 'order.items', 'order.user', 'product', 'seller'] },
    );
  }

  /**
   * ID로 배송 정보를 조회합니다.
   */
  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne(
      { id },
      { populate: ['order', 'order.items', 'order.user', 'product', 'seller'] },
    );

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

    await this.entityManager.removeAndFlush(delivery);
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
    for (const delivery of deliveries) {
      delivery.status = status;

      // 상태에 따른 날짜 업데이트
      if (status === DeliveryStatus.SHIPPING) {
        delivery.shippedAt = new Date();
      } else if (status === DeliveryStatus.DELIVERED) {
        delivery.deliveredAt = new Date();
      } else if (status === DeliveryStatus.CANCELED) {
        delivery.canceledAt = new Date();
      }
    }

    await this.entityManager.flush();
  }
}
