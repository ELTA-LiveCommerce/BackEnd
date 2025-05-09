import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';

import { CreatePaymentDto } from './dto/create-payment.dto';
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
   * 셀러가 주문에 대한 입금 정보를 생성합니다.
   */
  async create(createPaymentDto: CreatePaymentDto, user: User): Promise<Payment> {
    // 주문 확인
    const order = await this.entityManager.findOne(Order, { id: createPaymentDto.orderId }, { populate: ['items'] });
    if (!order) {
      throw new NotFoundException(`Order with ID ${createPaymentDto.orderId} not found`);
    }

    // 판매자 권한 확인
    const isSellerProduct = order.items.getItems().some((item) => item.product?.seller?.id === user.id);
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
      return this.paymentRepository.findAll({ populate: ['order', 'seller'] });
    }

    // 판매자인 경우 자신의 상품 입금만 조회
    return this.paymentRepository.find({ seller: user }, { populate: ['order', 'seller'] });
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
      const isSeller = order.items.getItems().some((item) => item.product?.seller?.id === user.id);

      if (!isBuyer && !isSeller) {
        throw new ForbiddenException('You do not have permission to view this payment information');
      }
    }

    return this.paymentRepository.find({ order }, { populate: ['order', 'seller'] });
  }

  /**
   * ID로 입금 정보를 조회합니다.
   */
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ id }, { populate: ['order', 'seller'] });

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
}
