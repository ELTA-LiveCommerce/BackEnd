import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';

import { CreateDeliveryDto } from './dto/create-delivery.dto';
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
      return this.deliveryRepository.findAll({ populate: ['order', 'product', 'seller'] });
    }

    // 판매자인 경우 자신의 상품 배송만 조회
    return this.deliveryRepository.find({ seller: user }, { populate: ['order', 'product', 'seller'] });
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

    return this.deliveryRepository.find({ order }, { populate: ['order', 'product', 'seller'] });
  }

  /**
   * ID로 배송 정보를 조회합니다.
   */
  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ id }, { populate: ['order', 'product', 'seller'] });

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
}
