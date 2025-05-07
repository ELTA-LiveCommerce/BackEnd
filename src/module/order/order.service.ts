import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';

import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import {
  OrderItemResponseDto,
  OrderResponseDto,
  OrderSummaryDto,
  PaginatedOrdersResponseDto,
} from './dto/order-response.dto';
import { OrderItem } from './entity/order-item.entity';
import { Order } from './entity/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: EntityRepository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly productService: ProductService,
    private readonly em: EntityManager,
  ) {}

  /**
   * 새로운 주문을 생성합니다.
   * @param userId 주문하는 사용자 ID
   * @param createOrderDto 주문 생성 DTO
   */
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 주문 번호 생성
    const orderNumber = this.generateOrderNumber();

    // 새 주문 생성
    const order = new Order();
    order.user = user;
    order.orderNumber = orderNumber;
    order.status = OrderStatus.PENDING;
    order.shippingAddress = createOrderDto.shippingAddress;
    order.notes = createOrderDto.notes;
    order.paymentMethod = createOrderDto.paymentMethod;

    // 주문 아이템 처리
    let totalAmount = 0;
    for (const itemDto of createOrderDto.items) {
      const product = await this.productRepository.findOne({ id: itemDto.productId });
      if (!product) {
        throw new NotFoundException(`상품 ID ${itemDto.productId}를 찾을 수 없습니다.`);
      }

      // 재고 확인
      if (product.stockQuantity < itemDto.quantity) {
        throw new BadRequestException(`상품 ${product.name}의 재고가 부족합니다. 현재 재고: ${product.stockQuantity}`);
      }

      // 주문 아이템 생성
      const orderItem = new OrderItem();
      orderItem.order = order;
      orderItem.product = product;
      orderItem.quantity = itemDto.quantity;
      orderItem.price = product.price;
      orderItem.totalPrice = product.price * itemDto.quantity;
      orderItem.attributes = itemDto.attributes;

      // 재고 감소
      product.stockQuantity -= itemDto.quantity;

      // 총 금액 계산
      totalAmount += orderItem.totalPrice;

      // 아이템 컬렉션에 추가
      order.items.add(orderItem);
    }

    // 총 금액 설정
    order.totalAmount = totalAmount;

    // 주문 저장
    await this.em.persistAndFlush(order);

    return this.mapToOrderResponseDto(order);
  }

  /**
   * 사용자의 주문 목록을 조회합니다.
   * @param userId 사용자 ID
   * @param getOrdersDto 주문 조회 DTO
   */
  async getOrdersByUser(userId: string, getOrdersDto: GetOrdersDto): Promise<PaginatedOrdersResponseDto> {
    const { status, search, page = 1, limit = 10 } = getOrdersDto;
    const skip = (page - 1) * limit;

    // 쿼리 빌더 설정
    let queryBuilder = this.orderRepository.createQueryBuilder('o');
    queryBuilder = queryBuilder.where({ user: { id: userId } });

    // 상태 필터 적용
    if (status) {
      queryBuilder = queryBuilder.andWhere({ status });
    }

    // 검색어 필터 적용
    if (search) {
      queryBuilder = queryBuilder.andWhere({ orderNumber: { $like: `%${search}%` } });
    }

    // 주문 정렬 (최신순)
    queryBuilder = queryBuilder.orderBy({ createdAt: 'DESC' });

    // 총 개수 조회
    const total = await queryBuilder.clone().count();

    // 결과 조회 (페이지네이션 적용)
    const orders = await queryBuilder.limit(limit).offset(skip).getResult();

    // 주문 요약 정보로 매핑
    const items = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await this.orderItemRepository.count({ order: { id: order.id } });
        return this.mapToOrderSummaryDto(order, itemCount);
      }),
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 주문 상세 정보를 조회합니다.
   * @param orderId 주문 ID
   * @param userId 사용자 ID (권한 확인용)
   */
  async getOrderDetail(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne(
      { id: orderId, user: { id: userId } },
      { populate: ['items', 'items.product'] },
    );

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return this.mapToOrderResponseDto(order);
  }

  /**
   * 주문을 취소합니다.
   * @param orderId 주문 ID
   * @param userId 사용자 ID (권한 확인용)
   * @param reason 취소 사유
   */
  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne(
      { id: orderId, user: { id: userId } },
      { populate: ['items', 'items.product'] },
    );

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 이미 배송 중이거나 완료된 주문은 취소 불가
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)) {
      throw new BadRequestException('이미 배송 중이거나 배송 완료된 주문은 취소할 수 없습니다.');
    }

    // 이미 취소된 주문인 경우
    if ([OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order.status)) {
      throw new BadRequestException('이미 취소된 주문입니다.');
    }

    // 주문 상태 변경
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason;
    order.cancelledAt = new Date();

    // 재고 복구
    for (const item of order.items) {
      const product = item.product;
      product.stockQuantity += item.quantity;
    }

    await this.em.flush();

    return this.mapToOrderResponseDto(order);
  }

  /**
   * 주문 Entity를 Response DTO로 변환합니다.
   * @param order 주문 Entity
   */
  private mapToOrderResponseDto(order: Order): OrderResponseDto {
    const itemDtos: OrderItemResponseDto[] = order.items.getItems().map((item) => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      attributes: item.attributes,
      productImage: item.product.productImage,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.user.id,
      status: order.status,
      items: itemDtos,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      shippingAddress: order.shippingAddress,
      shippingCode: order.shippingCode,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      refundedAt: order.refundedAt,
    };
  }

  /**
   * 주문 Entity를 요약 DTO로 변환합니다.
   * @param order 주문 Entity
   * @param itemCount 주문 아이템 개수
   */
  private mapToOrderSummaryDto(order: Order, itemCount: number): OrderSummaryDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * 주문 번호를 생성합니다.
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${year}${month}${day}-${random}`;
  }
}
