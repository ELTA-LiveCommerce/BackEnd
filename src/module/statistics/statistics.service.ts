import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, QueryBuilder } from '@mikro-orm/postgresql';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Order } from '@/module/order/entity/order.entity';
import { SellerStatisticsSortField, SortOrder } from '@/api/v2/admin/statistics/dto/admin-statistics-request.dto';
import { UserRole } from '@/shared/enum/user-role.enum';
import { OrderStatus } from '@/shared/enum/order-status.enum';

// 셀러 통계 인터페이스 정의
interface SellerStatistic {
  id: string;
  sellerName: string;
  totalSales: number;
  productCount: number;
  broadcastCount: number;
  maxViewers: number;
  profileImageUrl: string;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    @InjectRepository(Broadcast)
    private readonly broadcastRepository: EntityRepository<Broadcast>,
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
  ) {}

  async getSellerStatistics(options: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: SellerStatisticsSortField;
    sortOrder?: SortOrder;
  }) {
    const { page, limit, search, sortBy = SellerStatisticsSortField.TOTAL_SALES, sortOrder = SortOrder.DESC } = options;
    const offset = (page - 1) * limit;

    // 셀러 목록 가져오기 (role이 SELLER인 사용자만)
    const qb = this.userRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.profileImage'])
      .where({ role: UserRole.SELLER });

    // 검색어가 있으면 셀러 이름으로 검색
    if (search) {
      qb.andWhere({ name: { $like: `%${search}%` } });
    }

    // 총 셀러 수 카운트
    const total = await qb.clone().count('u.id', true);

    // 페이지네이션 적용
    qb.offset(offset).limit(limit);

    // 조회할 셀러 목록 가져오기
    const sellers = await qb.getResultList();
    const sellerStatistics: SellerStatistic[] = [];

    // 각 셀러별 통계 정보 수집
    for (const seller of sellers) {
      // 1. 상품 수 조회
      const productCount = await this.productRepository.count({ seller });

      // 2. 방송 수 조회
      const broadcastCount = await this.broadcastRepository.count({ seller });

      // 3. 총 매출 조회 (PAID, PROCESSING, SHIPPED, DELIVERED 상태의 주문만)
      const completedStatuses = [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

      const orders = await this.orderRepository
        .createQueryBuilder('o')
        .select(['o.id', 'o.totalAmount', 'oi.id'])
        .leftJoin('o.items', 'oi')
        .leftJoin('oi.product', 'p')
        .leftJoin('p.seller', 's')
        .where({ status: { $in: completedStatuses } })
        .andWhere({ 's.id': seller.id })
        .getResultList();

      let totalSales = 0;
      orders.forEach((order) => {
        totalSales += order.totalAmount;
      });

      // 4. 최고 시청자 수 조회 (Stream 엔티티가 있다면 그에 맞게 수정 필요)
      // 현재는 임의의 값을 설정
      const maxViewers = Math.floor(Math.random() * 1000) + 1; // 실제 데이터로 대체 필요

      // 셀러 통계 정보 추가
      sellerStatistics.push({
        id: seller.id,
        sellerName: seller.name,
        totalSales,
        productCount,
        broadcastCount,
        maxViewers,
        profileImageUrl: seller.profileImage || '',
      });
    }

    // 정렬 적용
    if (sortBy) {
      sellerStatistics.sort((a, b) => {
        const order = sortOrder === SortOrder.ASC ? 1 : -1;

        switch (sortBy) {
          case SellerStatisticsSortField.SELLER_NAME:
            return order * a.sellerName.localeCompare(b.sellerName);
          case SellerStatisticsSortField.TOTAL_SALES:
            return order * (a.totalSales - b.totalSales);
          case SellerStatisticsSortField.PRODUCT_COUNT:
            return order * (a.productCount - b.productCount);
          case SellerStatisticsSortField.BROADCAST_COUNT:
            return order * (a.broadcastCount - b.broadcastCount);
          case SellerStatisticsSortField.MAX_VIEWERS:
            return order * (a.maxViewers - b.maxViewers);
          default:
            return 0;
        }
      });
    }

    return {
      statistics: sellerStatistics,
      total,
    };
  }
}

