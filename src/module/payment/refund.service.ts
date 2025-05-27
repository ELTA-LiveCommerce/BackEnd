import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';

import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { Refund, RefundStatus } from './entity/refund.entity';
import { Order } from '../order/entity/order.entity';
import { User } from '../user/entity/user.entity';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: EntityRepository<Refund>,
    @InjectRepository(Payment)
    private paymentRepository: EntityRepository<Payment>,
    private readonly entityManager: SqlEntityManager,
  ) {}

  /**
   * 환불 요청을 생성합니다.
   */
  async create(createRefundDto: CreateRefundDto, user: User): Promise<Refund> {
    // 주문 확인
    const order = await this.entityManager.findOne(Order, { id: createRefundDto.orderId }, { populate: ['items'] });
    if (!order) {
      throw new NotFoundException(`Order with ID ${createRefundDto.orderId} not found`);
    }

    // 결제 확인
    const payment = await this.paymentRepository.findOne({ id: createRefundDto.paymentId }, { populate: ['order'] });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${createRefundDto.paymentId} not found`);
    }

    // 결제와 주문 매칭 확인
    if (payment.order.id !== order.id) {
      throw new BadRequestException(`Payment does not match with the order`);
    }

    // 결제 상태 확인 (완료된 결제만 환불 가능)
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(`Cannot refund a payment that is not completed`);
    }

    // 요청자 권한 확인
    let sellerId = '';
    if (user.role === UserRole.VIEWER) {
      // 구매자인 경우, 자신의 주문만 환불 가능
      if (order.user?.id !== user.id) {
        throw new ForbiddenException('You do not have permission to request refund for this order');
      }
      // 판매자 ID 찾기
      const sellerProduct = order.items.find((item) => item.product?.seller);
      if (!sellerProduct || !sellerProduct.product?.seller) {
        throw new BadRequestException('Cannot find seller information for this order');
      }
      sellerId = sellerProduct.product.seller.id;
    } else if (user.role === UserRole.SELLER) {
      // 판매자인 경우, 자신이 판매한 상품의 주문만 환불 가능
      const isSeller = order.items.some((item) => item.product?.seller?.id === user.id);
      if (!isSeller) {
        throw new ForbiddenException('You do not have permission to refund this order');
      }
      sellerId = user.id;
    } else {
      // 관리자인 경우 판매자 ID 찾기
      const sellerProduct = order.items.find((item) => item.product?.seller);
      if (!sellerProduct || !sellerProduct.product?.seller) {
        throw new BadRequestException('Cannot find seller information for this order');
      }
      sellerId = sellerProduct.product.seller.id;
    }

    // 기존 환불 요청 확인
    const existingRefund = await this.refundRepository.findOne({
      order: order,
      status: { $in: [RefundStatus.REQUESTED, RefundStatus.PROCESSING] },
    });

    if (existingRefund) {
      throw new BadRequestException(`There is already an active refund request for this order`);
    }

    // 환불 금액 검증
    if (createRefundDto.amount > payment.amount) {
      throw new BadRequestException(`Refund amount cannot be greater than payment amount`);
    }

    // 환불 생성
    const refund = new Refund();
    refund.order = order;
    refund.payment = payment;

    // 판매자 조회 및 null 체크
    const seller = await this.entityManager.findOne(User, { id: sellerId });
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }
    refund.seller = seller;
    refund.requestedBy = user;
    refund.status = createRefundDto.status || RefundStatus.REQUESTED;
    refund.reason = createRefundDto.reason;
    refund.amount = createRefundDto.amount;
    refund.description = createRefundDto.description;

    await this.entityManager.persistAndFlush(refund);
    return refund;
  }

  /**
   * 모든 환불 요청을 조회합니다.
   */
  async findAll(user: User): Promise<Refund[]> {
    if (user.role === UserRole.ADMIN) {
      return this.refundRepository.findAll({ populate: ['order', 'payment', 'seller', 'requestedBy'] });
    } else if (user.role === UserRole.SELLER) {
      // 판매자는 자신의 상품에 대한 환불 요청만 조회
      return this.refundRepository.find({ seller: user }, { populate: ['order', 'payment', 'requestedBy'] });
    } else {
      // 일반 사용자는 자신이 요청한 환불만 조회
      return this.refundRepository.find({ requestedBy: user }, { populate: ['order', 'payment', 'seller'] });
    }
  }

  /**
   * ID로 환불 요청을 조회합니다.
   */
  async findOne(id: string, user: User): Promise<Refund> {
    const refund = await this.refundRepository.findOne(
      { id },
      { populate: ['order', 'payment', 'seller', 'requestedBy'] },
    );

    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }

    // 권한 확인
    if (user.role === UserRole.VIEWER && refund.requestedBy.id !== user.id) {
      throw new ForbiddenException('You do not have permission to view this refund request');
    } else if (user.role === UserRole.SELLER && refund.seller.id !== user.id) {
      throw new ForbiddenException('You do not have permission to view this refund request');
    }

    return refund;
  }

  /**
   * 특정 주문의 환불 요청을 조회합니다.
   */
  async findByOrder(orderId: string, user: User): Promise<Refund[]> {
    const order = await this.entityManager.findOne(Order, { id: orderId }, { populate: ['items'] });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // 권한 확인
    if (user.role === UserRole.VIEWER) {
      // 일반 사용자는 자신의 주문에 대한 환불만 조회 가능
      if (order.user?.id !== user.id) {
        throw new ForbiddenException('You do not have permission to view refunds for this order');
      }
    } else if (user.role === UserRole.SELLER) {
      // 판매자는 자신이 판매한 상품의 주문에 대한 환불만 조회 가능
      const isSeller = order.items.some((item) => item.product?.seller?.id === user.id);
      if (!isSeller) {
        throw new ForbiddenException('You do not have permission to view refunds for this order');
      }
    }

    return this.refundRepository.find({ order }, { populate: ['payment', 'seller', 'requestedBy'] });
  }

  /**
   * 환불 요청을 처리합니다 (승인 또는 거절).
   */
  async update(id: string, updateRefundDto: UpdateRefundDto, user: User): Promise<Refund> {
    const refund = await this.findOne(id, user);

    // 권한 확인 - 판매자 또는 관리자만 환불 요청 처리 가능
    if (user.role === UserRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to process this refund request');
    } else if (user.role === UserRole.SELLER && refund.seller.id !== user.id) {
      throw new ForbiddenException('You do not have permission to process this refund request');
    }

    // 이미 완료되거나 거절된 환불 요청은 수정 불가
    if (refund.status === RefundStatus.COMPLETED || refund.status === RefundStatus.REJECTED) {
      throw new BadRequestException(`Cannot update a ${refund.status.toLowerCase()} refund request`);
    }

    // 상태 업데이트
    if (updateRefundDto.status) {
      refund.status = updateRefundDto.status;

      // 상태에 따른 자동 처리
      if (updateRefundDto.status === RefundStatus.COMPLETED) {
        // 환불 완료 시 결제 상태도 업데이트
        const payment = await this.paymentRepository.findOne({ id: refund.payment.id });
        if (payment) {
          payment.status = PaymentStatus.REFUNDED;
          payment.refundedAt = new Date();
          this.entityManager.persist(payment);
        }
        refund.completedAt = new Date();
      } else if (updateRefundDto.status === RefundStatus.REJECTED) {
        // 거절 이유 필수
        if (!updateRefundDto.rejectionReason) {
          throw new BadRequestException('Rejection reason is required when rejecting a refund');
        }
        refund.rejectionReason = updateRefundDto.rejectionReason;
        refund.rejectedAt = new Date();
      }
    }

    await this.entityManager.flush();
    return refund;
  }

  /**
   * 환불 요청을 삭제합니다 (관리자 전용).
   */
  async remove(id: string, user: User): Promise<void> {
    // 관리자만 환불 요청 삭제 가능
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can delete refund requests');
    }

    const refund = await this.refundRepository.findOne({ id });
    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }

    await this.entityManager.removeAndFlush(refund);
  }
}

