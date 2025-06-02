import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { Order } from './entity/order.entity';
import { ReturnRequest } from './entity/return-request.entity';
import { RefundService } from '../payment/refund.service';
import { RefundReason } from '../payment/entity/refund.entity';
import { PaymentService } from '../payment/payment.service';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { RefundEntity } from '../refund/entity/refund.entity';
import { RefundStatus } from '@/shared/enum/refund-status.enum';

@Injectable()
export class ReturnRequestService {
  constructor(
    @InjectRepository(ReturnRequest)
    private readonly returnRequestRepository: EntityRepository<ReturnRequest>,
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
    @InjectRepository(RefundEntity)
    private readonly refundEntityRepository: EntityRepository<RefundEntity>,
    private readonly em: EntityManager,
    private readonly refundService: RefundService,
    private readonly paymentService: PaymentService,
  ) {}

  async create(createReturnRequestDto: CreateReturnRequestDto, userId: string): Promise<ReturnRequest> {
    return await this.em.transactional(async (em) => {
      // 주문 정보 확인 (items, user 포함하여 로드)
      const order = await em.findOne(Order, { id: createReturnRequestDto.orderId }, { 
        populate: ['user', 'items', 'items.product', 'items.product.seller'] 
      });
      if (!order) {
        throw new NotFoundException(`주문을 찾을 수 없습니다: ${createReturnRequestDto.orderId}`);
      }

      // 사용자가 주문한 사용자인지 확인
      if (order.user.id !== userId) {
        throw new NotFoundException('해당 주문에 대한 권한이 없습니다.');
      }

      const user = order.user;

      // 주문의 모든 아이템에 대해 RefundEntity 생성 (refunds 테이블에 저장)
      const refundEntities: RefundEntity[] = [];
      for (const orderItem of order.items) {
        const refundEntity = new RefundEntity();
        refundEntity.orderItem = orderItem;
        refundEntity.product = orderItem.product;
        refundEntity.seller = orderItem.product.seller;
        refundEntity.buyer = user;
        refundEntity.quantity = orderItem.quantity;
        refundEntity.reason = `${createReturnRequestDto.reasonCategory} - ${createReturnRequestDto.reasonDetail}`;
        refundEntity.status = RefundStatus.REQUESTED;
        refundEntity.returnAddress = user.address || '';
        refundEntity.buyerBankName = ''; // 추후 입력
        refundEntity.buyerAccountNumber = ''; // 추후 입력
        
        em.persist(refundEntity);
        refundEntities.push(refundEntity);
      }

      // 반품 요청도 생성 (기존 로직과의 호환성을 위해 유지)
      const returnRequest = new ReturnRequest({
        order,
        reasonCategory: createReturnRequestDto.reasonCategory,
        reasonDetail: createReturnRequestDto.reasonDetail,
        pickupName: user.name,
        pickupAddress: user.address || '',
        pickupType: createReturnRequestDto.pickupType,
        pickupNote: createReturnRequestDto.pickupNote,
      });

      em.persist(returnRequest);

      // 주문 상태를 REFUND_REQUESTED로 업데이트 (반품 상태)
      order.status = OrderStatus.REFUND_REQUESTED;
      order.refundReason = `${createReturnRequestDto.reasonCategory} - ${createReturnRequestDto.reasonDetail}`;
      em.persist(order);

      await em.flush();

      // 주문과 연결된 결제 정보 찾기 - 트랜잭션 외부에서 처리
      // 환불 생성은 별도 트랜잭션에서 처리되므로 반품 요청과 분리
      setTimeout(async () => {
        try {
          const payments = await this.paymentService.findByOrder(order.id, user);
          if (payments && payments.length > 0) {
            // 가장 최근의 완료된 결제 선택
            const completedPayment = payments.find(p => p.status === 'COMPLETED') || payments[0];
            
            if (completedPayment) {
              try {
                // 자동으로 환불 요청 생성 (refunds 테이블에 저장됨)
                await this.refundService.create({
                  orderId: order.id,
                  paymentId: completedPayment.id,
                  reason: RefundReason.CUSTOMER_REQUEST,
                  amount: order.totalAmount,
                  description: `반품 요청 사유: ${createReturnRequestDto.reasonCategory} - ${createReturnRequestDto.reasonDetail}`,
                }, user);
              } catch (error) {
                // 환불 생성 실패 시 로그만 남기고 반품 요청은 정상적으로 처리
                console.error('Failed to create refund automatically:', error);
              }
            }
          }
        } catch (error) {
          // 결제 정보 조회 실패 시에도 반품 요청은 정상적으로 처리
          console.error('Failed to find payments for order:', error);
        }
      }, 100);

      return returnRequest;
    });
  }

  async findByUserId(userId: string): Promise<ReturnRequest[]> {
    // 유저가 소유한 주문의 반품 요청을 쿼리로 가져옵니다
    const returnRequests = await this.em
      .createQueryBuilder(ReturnRequest, 'rr')
      .select('*')
      .leftJoinAndSelect('rr.order', 'o')
      .leftJoinAndSelect('o.user', 'u')
      .where({ 'u.id': userId })
      .orderBy({ 'rr.requestedAt': 'DESC' })
      .getResult();

    return returnRequests;
  }

  async findOne(id: string, userId: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRequestRepository.findOne({ id }, { populate: ['order.user'] });

    if (!returnRequest) {
      throw new NotFoundException(`반품 요청을 찾을 수 없습니다: ${id}`);
    }

    // 사용자가 주문한 사용자인지 확인
    if (returnRequest.order.user.id !== userId) {
      throw new NotFoundException('해당 반품 요청에 대한 권한이 없습니다.');
    }

    return returnRequest;
  }

  // 관리자용 메서드들 (상태 업데이트, 승인/거절 등)은 추가 구현 필요
}
