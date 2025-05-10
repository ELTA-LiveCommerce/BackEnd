import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Order } from '@/module/order/entity/order.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { ReturnPickupType } from '@/shared/enum/return-pickup-type.enum';
import { ReturnReasonCategory, ReturnReasonDetail } from '@/shared/enum/return-reason.enum';

/**
 * 반품 상태
 */
export enum ReturnStatus {
  /**
   * 신청됨
   */
  REQUESTED = 'REQUESTED',

  /**
   * 회수 중
   */
  COLLECTING = 'COLLECTING',

  /**
   * 회수 완료
   */
  COLLECTED = 'COLLECTED',

  /**
   * 검수 중
   */
  INSPECTING = 'INSPECTING',

  /**
   * 반품 승인
   */
  APPROVED = 'APPROVED',

  /**
   * 반품 거절
   */
  REJECTED = 'REJECTED',

  /**
   * 환불 완료
   */
  REFUNDED = 'REFUNDED',
}

@Entity({ tableName: 'return_requests' })
export class ReturnRequest extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  /**
   * 연결된 주문
   */
  @ManyToOne(() => Order)
  order!: Order;

  /**
   * 반품 사유 카테고리
   */
  @Enum({ items: () => ReturnReasonCategory, type: 'string' })
  reasonCategory!: ReturnReasonCategory;

  /**
   * 반품 사유 상세
   */
  @Enum({ items: () => ReturnReasonDetail, type: 'string' })
  reasonDetail!: ReturnReasonDetail;

  /**
   * 반품 상태
   */
  @Enum({ items: () => ReturnStatus, default: ReturnStatus.REQUESTED, type: 'string' })
  status: ReturnStatus = ReturnStatus.REQUESTED;

  /**
   * 회수자 이름
   */
  @Property({ type: 'string' })
  pickupName!: string;

  /**
   * 회수지 주소
   */
  @Property({ type: 'text' })
  pickupAddress!: string;

  /**
   * 회수 요청 방법
   */
  @Enum({ items: () => ReturnPickupType, type: 'string' })
  pickupType!: ReturnPickupType;

  /**
   * 회수 요청 상세 사항 (기타 장소인 경우)
   */
  @Property({ type: 'text', nullable: true })
  pickupNote?: string;

  /**
   * 반품 요청 날짜
   */
  @Property({ type: 'Date' })
  requestedAt: Date = new Date();

  /**
   * 환불 완료 날짜
   */
  @Property({ type: 'Date', nullable: true })
  refundedAt?: Date;

  /**
   * 관리자 승인/거절 메모
   */
  @Property({ type: 'text', nullable: true })
  adminNote?: string;

  constructor(data: {
    id?: string;
    order: Order;
    reasonCategory: ReturnReasonCategory;
    reasonDetail: ReturnReasonDetail;
    pickupName: string;
    pickupAddress: string;
    pickupType: ReturnPickupType;
    pickupNote?: string;
  }) {
    super();
    if (data) {
      if (data.id) this.id = data.id;
      this.order = data.order;
      this.reasonCategory = data.reasonCategory;
      this.reasonDetail = data.reasonDetail;
      this.pickupName = data.pickupName;
      this.pickupAddress = data.pickupAddress;
      this.pickupType = data.pickupType;
      this.pickupNote = data.pickupNote;
    }
  }
}
