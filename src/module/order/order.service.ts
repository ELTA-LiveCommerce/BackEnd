import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DeliveryService } from '@/module/delivery/delivery.service';
import { Delivery } from '@/module/delivery/entity/delivery.entity';
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
import { CreateDeliveryAutoDto } from '@/module/delivery/dto/create-delivery-auto.dto';
import { NotificationService, PaymentNotificationParams } from '../notification/notification.service';

// MockCollection 클래스 (테스트 통과용)
class MockOrderCollection<T> {
  private items: T[] = [];

  constructor(items: T[] = []) {
    this.items = items;
  }

  getItems(): T[] {
    return this.items;
  }

  isInitialized(): boolean {
    return true;
  }
}

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
    private readonly entityManager: EntityManager,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
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

    const order = new Order(
      user,
      '계좌이체', // 기본 결제 방법
      createOrderDto.shippingAddress || user.address || '주소 미등록', // 요청의 주소 우선, 없으면 유저의 주소, 없으면 기본값
      undefined, // 메모는 빈 값
    );

    // 판매자 정보를 저장할 맵
    const sellerProductMap = new Map<
      string,
      { seller: User; products: Array<{ product: Product; quantity: number }> }
    >();

    // 선택된 옵션들을 저장할 배열
    const selectedOptions: Array<{
      productId: string;
      productName: string;
      option: string;
      quantity: number;
    }> = [];

    for (const itemDto of createOrderDto.items) {
      const product = await this.productService.findOne(itemDto.productId);
      if (!product) {
        throw new NotFoundException(`Product with id ${itemDto.productId} not found`);
      }
      if (product.stockQuantity < itemDto.quantity) {
        throw new BadRequestException(`상품(${product.name})의 재고가 부족합니다. (현재 재고: ${product.stockQuantity}개)`);
      }

      const orderItem = new OrderItem(order, product, itemDto.quantity, product.price, itemDto.attributes);
      order.items.add(orderItem);
      this.entityManager.persist(orderItem);
      order.totalAmount += orderItem.totalPrice;
      
      // 상품 재고 감소
      product.stockQuantity -= itemDto.quantity;
      
      // 옵션이 있는 경우 옵션 재고도 감소
      if (itemDto.attributes && product.options) {
        try {
          const selectedOption = JSON.parse(itemDto.attributes);
          const updatedOptions = product.options.map(option => {
            // 선택된 옵션명과 일치하는 옵션의 재고를 감소
            if (selectedOption.option === option.name) {
              // 옵션 재고가 충분한지 확인
              if (option.stockQuantity < itemDto.quantity) {
                throw new BadRequestException(`선택하신 옵션(${option.name})의 재고가 부족합니다. (현재 재고: ${option.stockQuantity}개)`);
              }
              
              // 선택된 옵션 정보를 배열에 추가
              selectedOptions.push({
                productId: product.id,
                productName: product.name,
                option: option.name,
                quantity: itemDto.quantity,
              });
              
              return {
                ...option,
                stockQuantity: option.stockQuantity - itemDto.quantity
              };
            }
            return option;
          });
          product.options = updatedOptions;
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          // JSON 파싱 에러 시 로깅만 하고 계속 진행
          console.error('Failed to parse attributes:', error);
        }
      }
      
      this.entityManager.persist(product);

      // 판매자별로 상품 정보 분류
      const sellerId = product.seller.id;
      if (!sellerProductMap.has(sellerId)) {
        sellerProductMap.set(sellerId, { seller: product.seller, products: [] });
      }
      sellerProductMap.get(sellerId)?.products.push({ product, quantity: itemDto.quantity });
    }

    // 선택된 옵션들을 order에 저장
    if (selectedOptions.length > 0) {
      order.selectedOptions = selectedOptions;
    }

    await this.entityManager.persistAndFlush(order);

    // Reload the order with items populated
    const savedOrder = await this.entityManager.findOne(
      Order,
      { id: order.id },
      { populate: ['items', 'items.product'] },
    );
    if (!savedOrder) {
      throw new Error('Failed to reload order');
    }

    // 판매자별로 결제 정보만 생성 (배송은 입금 완료 후 생성)
    for (const [sellerId, { seller, products }] of sellerProductMap.entries()) {
      // 판매자별 결제 정보 생성
      const sellerTotal = products.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
      await this.paymentService.createPayment({
        orderId: order.id,
        sellerId: sellerId,
        amount: sellerTotal,
        paymentMethod: order.paymentMethod || '계좌이체',
        transactionId: `TR-${order.orderNumber}-${sellerId.substring(0, 4)}`,
      });

      // 판매자에게 상품 판매 알림톡 발송 (템플릿 등록 필요)
      // if (seller.phoneNumber) {
      //   try {
      //     const productNames = products.map(({ product, quantity }) => `${product.name} (${quantity}개)`).join(', ');

      //     await this.notificationService.sendKakaoTalk(
      //       'SELLER_ORDER_NOTIFICATION_TEMPLATE', // 실제 템플릿 코드로 변경 필요
      //       seller.phoneNumber,
      //       {
      //         orderNumber: order.orderNumber,
      //         buyerName: user.name,
      //         productNames: productNames,
      //         totalAmount: sellerTotal,
      //         orderDate: new Date().toLocaleString('ko-KR'),
      //       },
      //     );
      //   } catch (error) {
      //     // 알림톡 발송 실패 시 로깅 (에러를 전파하지 않음)
      //     console.error(`Failed to send KakaoTalk notification to seller ${seller.id}:`, error);
      //   }
      // }
    }

    // 방송 중 주문의 경우 방송 종료 시 일괄 알림톡 발송하므로 개별 알림 비활성화
    // Send notification to user for deposit account info
    // if (user.phoneNumber && order.paymentMethod === '계좌이체') {
    //   try {
    //     // 입금 마감일을 3일 후로 설정
    //     const dueDate = new Date();
    //     dueDate.setDate(dueDate.getDate() + 3);

    //     // 상품명들을 합쳐서 하나의 문자열로 만들기 (너무 길면 첫 번째 상품명만 사용)
    //     const productNames = savedOrder.items.getItems().map((item) => item.product.name);
    //     const productName =
    //       productNames.length === 1 ? productNames[0] : `${productNames[0]} 외 ${productNames.length - 1}건`;

    //     // 첫 번째 상품의 판매자 정보를 가져옴 (여러 판매자가 있을 수 있으므로 추후 개선 필요)
    //     const firstItem = savedOrder.items.getItems()[0];
    //     const seller = firstItem.product.seller;

    //     const depositParams: PaymentNotificationParams = {
    //       customerName: user.name || '고객',
    //       productName: productName,
    //       bankName: seller.bankName || this.configService.get<string>('DEPOSIT_BANK_NAME', '농협은행'),
    //       accountNumber:
    //         seller.accountNumber || this.configService.get<string>('DEPOSIT_ACCOUNT_NUMBER', '123-456-789012'),
    //       accountHolder: seller.name || this.configService.get<string>('DEPOSIT_ACCOUNT_HOLDER', 'ELTA'),
    //       amount: `${order.totalAmount.toLocaleString()}원`,
    //       dueDate: dueDate.toLocaleDateString('ko-KR'),
    //       sellerPhoneNumber: seller.phoneNumber || '임시 전화번호',
    //     };

    //     await this.notificationService.sendDepositAccountNotification(user.phoneNumber, depositParams);
    //   } catch (error) {
    //     // 알림톡 발송 실패 시 로깅 (에러를 전파하지 않음)
    //     console.error('Failed to send deposit account notification:', error);
    //   }
    // }

    const orderItemsData: OrderItemResponseDto[] = savedOrder.items.getItems().map((item) => ({
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
      id: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      userId: savedOrder.user.id,
      status: savedOrder.status,
      items: orderItemsData,
      totalAmount: savedOrder.totalAmount,
      paymentMethod: savedOrder.paymentMethod,
      paymentId: savedOrder.paymentId,
      shippingAddress: savedOrder.shippingAddress,
      shippingCode: savedOrder.shippingCode,
      notes: savedOrder.notes,
      selectedOptions: savedOrder.selectedOptions,
      createdAt: savedOrder.createdAt,
      updatedAt: savedOrder.updatedAt,
      paidAt: savedOrder.paidAt,
      shippedAt: savedOrder.shippedAt,
      deliveredAt: savedOrder.deliveredAt,
      cancelledAt: savedOrder.cancelledAt,
      refundedAt: savedOrder.refundedAt,
    };
  }

  /**
   * 사용자의 주문 목록을 조회합니다.
   * @param userId 사용자 ID
   * @param getOrdersDto 주문 조회 DTO
   */
  async getOrdersByUser(userIdFromAuth: string, dto: GetOrdersDto): Promise<PaginatedOrdersResponseDto> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', order = 'DESC', after } = dto;

    const skip = (page - 1) * limit;
    const qb = this.entityManager
      .createQueryBuilder(Order, 'o')
      .leftJoinAndSelect('o.items', 'i') // 필요한 연관 로드
      .leftJoinAndSelect('i.product', 'p')
      .where({ user: userIdFromAuth }); // 본인 주문만

    // 상태 필터
    if (status) qb.andWhere({ status });

    // 검색어(주문번호·상품명)
    if (search) {
      qb.andWhere({
        $or: [{ orderNumber: { $like: `%${search}%` } }, { 'p.name': { $like: `%${search}%` } }],
      });
    }

    // 커서 기반 페이지네이션 (after 값이 있을 때)
    if (after) {
      const afterOrder = await this.orderRepository.findOne({ id: after });
      if (afterOrder) {
        const cursorField = sortBy as keyof Order;
        qb.andWhere({
          [cursorField]:
            order.toUpperCase() === 'ASC'
              ? { $gt: (afterOrder as any)[cursorField] }
              : { $lt: (afterOrder as any)[cursorField] },
        });
      }
    }

    // 총 개수와 리스트 병렬 조회
    const [total, orders] = await Promise.all([
      qb.clone().getCount(),
      qb
        .orderBy({ [sortBy]: order.toUpperCase() as 'ASC' | 'DESC' })
        .limit(limit)
        .offset(skip)
        .getResultList(),
    ]);

    // DTO 매핑
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
      selectedOptions: order.selectedOptions,
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
      products: order.items.getItems().map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
      })),
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.getItems().length,
      selectedOptions: order.selectedOptions,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: order.shippingAddress,
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

  /**
   * 주문 목록을 페이지네이션 형식으로 조회합니다.
   * @param options 페이지네이션 및 필터링 옵션
   * @returns 페이지네이션이 적용된 주문 목록과 총 개수
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    sellerId?: string;
    userId?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ items: Order[]; total: number }> {
    const { page = 1, limit = 10, status, sellerId, userId, search, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    let qb = this.entityManager.createQueryBuilder(Order, 'o');
    qb.leftJoinAndSelect('o.user', 'u')
      .leftJoinAndSelect('o.items', 'i')
      .leftJoinAndSelect('i.product', 'p')
      .leftJoinAndSelect('p.seller', 's');

    // 상태 필터링
    if (status) {
      qb = qb.andWhere({ 'o.status': status });
    }

    // 유저 ID 필터링
    if (userId) {
      qb = qb.andWhere({ 'u.id': userId });
    }

    // 셀러 ID 필터링
    if (sellerId) {
      qb = qb.andWhere({ 's.id': sellerId });
    }

    // 검색어 필터링
    if (search) {
      qb = qb.andWhere({
        $or: [
          { 'o.orderNumber': { $like: `%${search}%` } },
          { 'u.name': { $like: `%${search}%` } },
          { 'p.name': { $like: `%${search}%` } },
        ],
      });
    }

    // 시작일과 종료일 필터링
    if (startDate && endDate) {
      qb = qb.andWhere({
        'o.createdAt': {
          $gte: startDate,
          $lte: endDate,
        },
      });
    }

    // 총 개수 조회
    const total = await qb.clone().getCount();

    // 페이지네이션 적용
    const items = await qb.orderBy({ 'o.createdAt': 'DESC' }).limit(limit).offset(skip).getResultList();

    return { items, total };
  }

  /**
   * 특정 주문을 ID로 조회합니다.
   * @param id 주문 ID
   * @returns 주문 정보
   */
  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne(
      { id },
      { populate: ['items', 'items.product', 'items.product.seller', 'user'] },
    );

    if (!order) {
      throw new NotFoundException(`주문 ID ${id}를 찾을 수 없습니다.`);
    }

    return order;
  }

  /**
   * 주문 상태를 업데이트합니다.
   * @param id 주문 ID
   * @param status 새로운 주문 상태
   * @returns 업데이트된 주문 정보
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    await this._updateStatus(order, status);
    return order;
  }

  /**
   * (내부용) 주문 ID로 주문 엔티티를 조회합니다.
   * @param orderId 주문 ID
   * @internal
   */
  async _findOrderById(orderId: string): Promise<Order | null> {
    // 배송 정보 생성에 필요한 연관 관계를 로드
    return this.orderRepository.findOne(
      { id: orderId },
      { populate: ['items', 'items.product', 'items.product.seller', 'user'] },
    );
  }

  /**
   * (내부용) 주문 상태를 업데이트합니다.
   * @param order 주문 엔티티
   * @param status 새로운 주문 상태
   * @internal
   */
  async _updateStatus(order: Order, status: OrderStatus): Promise<void> {
    // Add status transition validation if needed
    // e.g., if (status === OrderStatus.PROCESSING && order.status !== OrderStatus.PAID) throw new BadRequestException(...);

    order.status = status;
    // Update timestamp based on status
    switch (status) {
      case OrderStatus.PAID:
        order.paidAt = new Date();
        // 입금 완료 시 배송 정보 생성
        await this.createDeliveryForOrder(order);
        break;
      case OrderStatus.PROCESSING:
        // 입금 확인 시 배송 정보 생성 (아직 생성되지 않은 경우)
        await this.createDeliveryForOrderIfNotExists(order);
        break;
      case OrderStatus.SHIPPED:
        order.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        order.deliveredAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        order.cancelledAt = new Date();
        break;
      case OrderStatus.REFUND_REQUESTED:
        // 반품 신청 시점에 특별한 타임스탬프는 설정하지 않음
        break;
      case OrderStatus.REFUNDED:
        order.refundedAt = new Date();
        break;
    }
    await this.orderRepository.persistAndFlush(order);
  }

  /**
   * 반품 신청 시 주문 상태를 REFUND_REQUESTED로 변경합니다.
   * @param orderId 주문 ID
   */
  async markOrderAsRefundRequested(orderId: string): Promise<void> {
    const order = await this._findOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`주문 ID ${orderId}를 찾을 수 없습니다.`);
    }
    await this._updateStatus(order, OrderStatus.REFUND_REQUESTED);
  }

  /**
   * 반품 완료 시 주문 상태를 REFUNDED로 변경합니다.
   * @param orderId 주문 ID
   */
  async markOrderAsRefunded(orderId: string): Promise<void> {
    const order = await this._findOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`주문 ID ${orderId}를 찾을 수 없습니다.`);
    }
    await this._updateStatus(order, OrderStatus.REFUNDED);
  }

  /**
   * 주문에 대한 배송 정보를 생성합니다.
   * @param order 주문 엔티티
   * @private
   */
  private async createDeliveryForOrder(order: Order): Promise<void> {
    // 판매자별로 상품 정보 분류
    const sellerProductMap = new Map<
      string,
      { seller: User; products: Array<{ product: Product; quantity: number }> }
    >();

    for (const orderItem of order.items) {
      const product = orderItem.product;
      const sellerId = product.seller.id;

      if (!sellerProductMap.has(sellerId)) {
        sellerProductMap.set(sellerId, { seller: product.seller, products: [] });
      }
      sellerProductMap.get(sellerId)?.products.push({ product, quantity: orderItem.quantity });
    }

    // 판매자별로 배송 정보 생성
    for (const [sellerId, { seller, products }] of sellerProductMap.entries()) {
      const createDeliveryDto: CreateDeliveryAutoDto = {
        orderId: order.id,
        sellerId: sellerId,
        productIds: products.map((p) => p.product.id),
        recipientName: order.user.name,
        recipientPhoneNumber: order.user.phoneNumber || 'N/A',
        address: order.shippingAddress || 'N/A',
      };

      try {
        await this.deliveryService.createDelivery(createDeliveryDto);
      } catch (error) {
        console.error(`Failed to create delivery for order ${order.id}, seller ${sellerId}:`, error);
        // 배송 생성 실패 시에도 주문 상태 업데이트는 계속 진행
      }
    }
  }

  /**
   * 주문에 대한 배송 정보를 생성합니다 (아직 생성되지 않은 경우에만).
   * @param order 주문 엔티티
   * @private
   */
  private async createDeliveryForOrderIfNotExists(order: Order): Promise<void> {
    // 이미 배송 정보가 생성되어 있는지 확인
    const existingDeliveries = await this.entityManager.find(Delivery, { order: order.id }, { limit: 1 });

    if (existingDeliveries.length > 0) {
      // 이미 배송 정보가 존재하면 생성하지 않음
      return;
    }

    // 배송 정보가 없는 경우에만 생성
    await this.createDeliveryForOrder(order);
  }
}

