import { BaseRepository } from '@/shared/common/base.repository';
import { RefundStatusHistoryEntity } from '../entity/refund-status-history.entity';

export class RefundStatusHistoryRepository extends BaseRepository<RefundStatusHistoryEntity> {
  async findByRefundId(refundId: string): Promise<RefundStatusHistoryEntity[]> {
    return this.find(
      { refund: { id: refundId } },
      {
        orderBy: { createdAt: 'ASC' },
        populate: ['changedBy'],
      },
    );
  }
}

