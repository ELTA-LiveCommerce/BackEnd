import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { Order } from './entity/order.entity';
import { ReturnRequest } from './entity/return-request.entity';

@Injectable()
export class ReturnRequestService {
  constructor(
    @InjectRepository(ReturnRequest)
    private readonly returnRequestRepository: EntityRepository<ReturnRequest>,
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
    private readonly em: EntityManager,
  ) {}

  async create(createReturnRequestDto: CreateReturnRequestDto, userId: string): Promise<ReturnRequest> {
    // 주문 정보 확인
    const order = await this.orderRepository.findOne({ id: createReturnRequestDto.orderId }, { populate: ['user'] });
    if (!order) {
      throw new NotFoundException(`주문을 찾을 수 없습니다: ${createReturnRequestDto.orderId}`);
    }

    // 사용자가 주문한 사용자인지 확인
    if (order.user.id !== userId) {
      throw new NotFoundException('해당 주문에 대한 권한이 없습니다.');
    }

    // 반품 요청 생성
    const returnRequest = new ReturnRequest({
      order,
      reasonCategory: createReturnRequestDto.reasonCategory,
      reasonDetail: createReturnRequestDto.reasonDetail,
      pickupName: createReturnRequestDto.pickupName,
      pickupAddress: createReturnRequestDto.pickupAddress,
      pickupType: createReturnRequestDto.pickupType,
      pickupNote: createReturnRequestDto.pickupNote,
    });

    await this.em.persistAndFlush(returnRequest);
    return returnRequest;
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
