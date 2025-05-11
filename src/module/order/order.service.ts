import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { DeliveryService } from '@/module/delivery/delivery.service';
import { CreateOrderDto } from '@/module/order/dto/create-order.dto';
import { GetOrdersDto } from '@/module/order/dto/get-orders.dto';
import {
  OrderItemResponseDto,
  OrderResponseDto,
  OrderSummaryDto,
  PaginatedOrdersResponseDto,
} from '@/module/order/dto/order-response.dto';
import { UpdateShippingDto } from '@/module/order/dto/update-shipping.dto';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { Order } from '@/module/order/entity/order.entity';
import { PaymentService } from '@/module/payment/payment.service';
import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';

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
    private readonly deliveryService: DeliveryService,
    private readonly paymentService: PaymentService,
    private readonly entityManager: SqlEntityManager,
  ) {}

  /**
   * 새로운 주문을 생성합니다.
   * @param userId 주문하는 사용자 ID
   * @param createOrderDto 주문 생성 DTO
   */
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const user = await this.entityManager.findOne(User, { id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const order = new Order(user, createOrderDto.paymentMethod, createOrderDto.shippingAddress, createOrderDto.notes);

    // 판매자 정보를 저장할 맵
    const sellerProductMap = new Map<
      string,
      { seller: User; products: Array<{ product: Product; quantity: number }> }
    >();

    for (const itemDto of createOrderDto.items) {
      const product = await this.productService.findOne(itemDto.productId);
      if (!product) {
        throw new NotFoundException(`Product with id ${itemDto.productId} not found`);
      }
      if (product.stockQuantity < itemDto.quantity) {
        throw new BadRequestException(`Product ${product.name} is out of stock`);
      }

      const orderItem = new OrderItem(order, product, itemDto.quantity, product.price /*, itemDto.attributes*/);
      order.items.add(orderItem);
      order.totalAmount += orderItem.totalPrice;
      product.stockQuantity -= itemDto.quantity;
      this.entityManager.persist(product);

      // 판매자별로 상품 정보 분류
      const sellerId = product.seller.id;
      if (!sellerProductMap.has(sellerId)) {
        sellerProductMap.set(sellerId, { seller: product.seller, products: [] });
      }
      sellerProductMap.get(sellerId)?.products.push({ product, quantity: itemDto.quantity });
    }

    await this.entityManager.persistAndFlush(order);

    // 판매자별로 배송 정보 생성
    for (const [sellerId, { seller, products }] of sellerProductMap.entries()) {
      // 판매자별 배송 정보 생성
      await this.deliveryService.createDelivery({
        orderId: order.id,
        sellerId: sellerId,
        productIds: products.map((p) => p.product.id),
        shippingAddress: order.shippingAddress || '',
      });

      // 판매자별 결제 정보 생성
      const sellerTotal = products.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
      await this.paymentService.createPayment({
        orderId: order.id,
        sellerId: sellerId,
        amount: sellerTotal,
        paymentMethod: order.paymentMethod || '무통장입금',
        transactionId: `TR-${order.orderNumber}-${sellerId.substring(0, 4)}`,
      });
    }

    const orderItemsData: OrderItemResponseDto[] = order.items.getItems().map((item) => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.mainImage,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      attributes: item.attributes,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.user.id,
      status: order.status,
      items: orderItemsData,
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
   * 사용자의 주문 목록을 조회합니다.
   * @param userId 사용자 ID
   * @param getOrdersDto 주문 조회 DTO
   */
  async getOrdersByUser(userIdFromAuth: string, getOrdersDto: GetOrdersDto): Promise<PaginatedOrdersResponseDto> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', order = 'DESC', after } = getOrdersDto;
    const skip = (page - 1) * limit;

    const qb = this.entityManager.createQueryBuilder(Order, 'o');
    qb.where({ user: userIdFromAuth });

    if (status) {
      qb.andWhere({ status });
    }
    if (search) {
      // Implement search logic
    }

    if (after) {
      const afterOrder = await this.entityManager.findOne(Order, { id: after });
      if (afterOrder) {
        const cursorField = sortBy as keyof Order;
        const cursorCondition =
          order === 'ASC'
            ? { [cursorField]: { $gt: (afterOrder as any)[cursorField] } }
            : { [cursorField]: { $lt: (afterOrder as any)[cursorField] } };
        qb.andWhere(cursorCondition);
      }
    }

    const countPromise = qb.clone().getCount();
    const listPromise = qb
      .orderBy({ [sortBy]: order.toUpperCase() as 'ASC' | 'DESC' })
      .limit(limit)
      .offset(skip)
      .getResultList();

    const [total, orders] = await Promise.all([countPromise, listPromise]);

    const items = orders.map((o) => this.mapToOrderSummaryDto(o));

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

    await this.entityManager.flush();

    return this.mapToOrderResponseDto(order);
  }

  /**
   * 셀러가 주문의 배송 정보를 업데이트합니다.
   * @param orderId 주문 ID
   * @param sellerId 셀러 ID (요청자)
   * @param updateShippingDto 배송 정보 DTO
   */
  async updateShippingInfoBySeller(
    orderId: string,
    sellerId: string,
    updateShippingDto: UpdateShippingDto,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne(
      { id: orderId },
      { populate: ['items', 'items.product', 'items.product.seller', 'user'] },
    );

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    const isSellerProductInOrder = order.items.getItems().some((item) => item.product.seller?.id === sellerId);

    if (!isSellerProductInOrder) {
      throw new ForbiddenException('해당 주문에 대한 배송 정보를 업데이트할 권한이 없습니다.');
    }

    if (![OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status)) {
      throw new BadRequestException(
        `현재 주문 상태(${order.status})에서는 배송 정보를 업데이트할 수 없습니다. 'PAID' 또는 'PROCESSING' 상태여야 합니다.`,
      );
    }

    order.status = updateShippingDto.status || OrderStatus.SHIPPED;
    order.shippingCode = updateShippingDto.shippingCode;

    if (order.status === OrderStatus.SHIPPED && !order.shippedAt) {
      order.shippedAt = new Date();
    }

    if (updateShippingDto.shippingMemo) {
      order.notes = order.notes
        ? `${order.notes}\n[배송메모] ${updateShippingDto.shippingMemo}`
        : `[배송메모] ${updateShippingDto.shippingMemo}`;
    }

    await this.entityManager.flush();
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
      productImage: item.product.mainImage,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      attributes: item.attributes,
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
   */
  private mapToOrderSummaryDto(order: Order): OrderSummaryDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
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

  async getPaginatedOrders(getOrdersDto: GetOrdersDto): Promise<PaginatedOrdersResponseDto> {
    const { page = 1, limit = 10, status, userId, sortBy = 'createdAt', order = 'DESC' } = getOrdersDto;
    const skip = (page - 1) * limit;

    const qb = this.entityManager.createQueryBuilder(Order, 'o');
    qb.select('*')
      .leftJoinAndSelect('o.user', 'u')
      .leftJoinAndSelect('o.items', 'i')
      .leftJoinAndSelect('i.product', 'p');

    if (status) {
      qb.andWhere({ status });
    }
    if (userId) {
      qb.andWhere({ user: userId });
    }

    const countPromise = qb.clone().getCount();
    const listPromise = qb
      .orderBy({ [sortBy]: order.toUpperCase() as 'ASC' | 'DESC' })
      .limit(limit)
      .offset(skip)
      .getResultList();

    const [total, orders] = await Promise.all([countPromise, listPromise]);

    const items = orders.map((o) => this.mapToOrderSummaryDto(o));

    return {
      items: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
