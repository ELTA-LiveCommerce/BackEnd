import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';

import { CreatePaymentAutoDto } from './dto/create-payment-auto.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SearchPaymentDto } from './dto/search-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { Order } from '../order/entity/order.entity';
import { User } from '../user/entity/user.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: EntityRepository<Payment>,
    private readonly entityManager: SqlEntityManager,
  ) {}

  /**
   * 주문 생성 시 자동으로 결제 정보를 생성합니다.
   */
  async createPayment(createPaymentAutoDto: CreatePaymentAutoDto): Promise<Payment> {
    // 주문 확인
    const order = await this.entityManager.findOne(Order, { id: createPaymentAutoDto.orderId });
    if (!order) {
      throw new NotFoundException(`Order with ID ${createPaymentAutoDto.orderId} not found`);
    }

    // 판매자 확인
    const seller = await this.entityManager.findOne(User, { id: createPaymentAutoDto.sellerId });
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${createPaymentAutoDto.sellerId} not found`);
    }

    // 결제 객체 생성
    const payment = new Payment();
    payment.order = order;
    payment.seller = seller;
    payment.status = PaymentStatus.PENDING;
    payment.amount = createPaymentAutoDto.amount;
    payment.paymentMethod = createPaymentAutoDto.paymentMethod || '무통장입금';
    payment.transactionId = createPaymentAutoDto.transactionId || `TR-${order.orderNumber}-${Date.now()}`;

    await this.entityManager.persistAndFlush(payment);
    return payment;
  }

  /**
   * 셀러가 주문에 대한 입금 정보를 생성합니다.
   */
  async create(createPaymentDto: CreatePaymentDto, user: User): Promise<Payment> {
    // 주문 확인
    const order = await this.entityManager.findOne(Order, { id: createPaymentDto.orderId }, { populate: ['items'] });
    if (!order) {
      throw new NotFoundException(`Order with ID ${createPaymentDto.orderId} not found`);
    }

    // 판매자 권한 확인
    const isSellerProduct = order.items.some((item) => item.product?.seller?.id === user.id);
    if (!isSellerProduct && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to manage payment for this order');
    }

    const payment = new Payment();
    payment.order = order;
    payment.seller = user;
    payment.status = createPaymentDto.status || PaymentStatus.PENDING;
    payment.amount = createPaymentDto.amount;
    payment.transactionId = createPaymentDto.transactionId;
    payment.paymentMethod = createPaymentDto.paymentMethod;
    payment.notes = createPaymentDto.notes;

    // 상태에 따라 날짜 설정
    if (payment.status === PaymentStatus.COMPLETED) {
      payment.completedAt = new Date();
    } else if (payment.status === PaymentStatus.CANCELED) {
      payment.canceledAt = new Date();
    } else if (payment.status === PaymentStatus.REFUNDED) {
      payment.refundedAt = new Date();
    }

    await this.entityManager.persistAndFlush(payment);
    return payment;
  }

  /**
   * 모든 입금 정보를 조회합니다.
   */
  async findAll(user: User): Promise<Payment[]> {
    if (user.role === UserRole.ADMIN) {
      return this.paymentRepository.findAll({
        populate: ['order', 'order.items', 'order.user', 'seller'],
        orderBy: { createdAt: 'DESC' },
      });
    }

    // 판매자인 경우 자신의 상품 입금만 조회
    return this.paymentRepository.find(
      { seller: user },
      {
        populate: ['order', 'order.items', 'order.user', 'seller'],
        orderBy: { createdAt: 'DESC' },
      },
    );
  }

  /**
   * 입금 정보를 검색합니다.
   * 키워드, 상태, 기간으로 필터링할 수 있습니다.
   */
  async search(searchDto: SearchPaymentDto, user: User): Promise<Payment[]> {
    const where: any = {};

    // 판매자인 경우 자신의 상품 입금만 조회 가능
    if (user.role !== UserRole.ADMIN) {
      where.seller = user;
    }

    // 입금 상태로 필터링
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
    const qb = this.entityManager.createQueryBuilder(Payment, 'p');
    qb.where(where)
      .leftJoinAndSelect('p.order', 'order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('p.seller', 'seller')
      .orderBy({ 'p.createdAt': 'DESC' });

    // 키워드 검색
    if (searchDto.keyword) {
      qb.andWhere(
        '(product.name LIKE :keyword OR user.username LIKE :keyword OR user.name LIKE :keyword OR p.transactionId LIKE :keyword OR seller.name LIKE :keyword)',
        { keyword: `%${searchDto.keyword}%` } as any,
      );
    }

    return qb.getResult();
  }

  /**
   * 특정 주문의 입금 정보를 조회합니다.
   */
  async findByOrder(orderId: string, user: User): Promise<Payment[]> {
    const order = await this.entityManager.findOne(Order, { id: orderId }, { populate: ['items'] });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // 관리자가 아닌 경우, 자신의 주문 또는 판매한 상품의 입금만 볼 수 있음
    if (user.role !== UserRole.ADMIN) {
      const isBuyer = order.user?.id === user.id;
      const isSeller = order.items.some((item) => item.product?.seller?.id === user.id);

      if (!isBuyer && !isSeller) {
        throw new ForbiddenException('You do not have permission to view this payment information');
      }
    }

    return this.paymentRepository.find(
      { order },
      {
        populate: ['order', 'order.items', 'order.user', 'seller'],
        orderBy: { createdAt: 'DESC' },
      },
    );
  }

  /**
   * ID로 입금 정보를 조회합니다.
   */
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne(
      { id },
      { populate: ['order', 'order.items', 'order.user', 'seller'] },
    );

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * 입금 정보를 업데이트합니다.
   */
  async update(id: string, updatePaymentDto: UpdatePaymentDto, user: User): Promise<Payment> {
    const payment = await this.findOne(id);

    // 판매자 권한 확인
    if (payment.seller.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this payment information');
    }

    // 입금 상태 업데이트 시 날짜 자동 설정
    if (updatePaymentDto.status) {
      switch (updatePaymentDto.status) {
        case PaymentStatus.COMPLETED:
          if (payment.status !== PaymentStatus.COMPLETED) {
            payment.completedAt = new Date();
          }
          break;
        case PaymentStatus.CANCELED:
          if (payment.status !== PaymentStatus.CANCELED) {
            payment.canceledAt = new Date();
          }
          break;
        case PaymentStatus.REFUNDED:
          if (payment.status !== PaymentStatus.REFUNDED) {
            payment.refundedAt = new Date();
          }
          break;
      }
    }

    this.entityManager.assign(payment, updatePaymentDto);
    await this.entityManager.flush();
    return payment;
  }

  /**
   * 입금 정보를 삭제합니다.
   */
  async remove(id: string, user: User): Promise<void> {
    const payment = await this.findOne(id);

    // 판매자 권한 확인
    if (payment.seller.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this payment information');
    }

    await this.entityManager.removeAndFlush(payment);
  }

  /**
   * 입금 상태 일괄 변경
   */
  async updateStatus(ids: string[], status: PaymentStatus, user: User): Promise<void> {
    // 입금 정보 조회
    const payments = await this.paymentRepository.find({ id: { $in: ids } });

    if (payments.length === 0) {
      throw new NotFoundException('선택한 입금 정보를 찾을 수 없습니다');
    }

    // 모든 입금이 해당 판매자/관리자의 것인지 확인
    const hasPermission = payments.every((payment) => payment.seller.id === user.id || user.role === UserRole.ADMIN);

    if (!hasPermission) {
      throw new ForbiddenException('일부 입금 정보에 대한 수정 권한이 없습니다');
    }

    // 상태 및 날짜 업데이트
    for (const payment of payments) {
      payment.status = status;

      // 상태에 따른 날짜 업데이트
      switch (status) {
        case PaymentStatus.COMPLETED:
          payment.completedAt = new Date();
          break;
        case PaymentStatus.CANCELED:
          payment.canceledAt = new Date();
          break;
        case PaymentStatus.REFUNDED:
          payment.refundedAt = new Date();
          break;
      }
    }

    await this.entityManager.flush();
  }
}

