import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Order } from '@/module/order/entity/order.entity';
import { SellerStatisticsSortField, SortOrder } from '@/api/v2/admin/statistics/dto/admin-statistics-request.dto';

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
    const { page, limit, search, sortBy, sortOrder } = options;

    // TODO: 실제 데이터베이스에서 통계 데이터를 조회하는 로직으로 구현 필요
    // 예시 데이터 생성
    const mockStatistics = Array.from({ length: limit }, (_, i) => {
      const id = `seller-${i + 1}`;
      const sellerName = `판매자 ${i + 1}`;

      return {
        id,
        sellerName: search ? `${search} ${i + 1}` : sellerName,
        totalSales: Math.floor(Math.random() * 10000000) + 500000,
        productCount: Math.floor(Math.random() * 50) + 1,
        broadcastCount: Math.floor(Math.random() * 20) + 1,
        maxViewers: Math.floor(Math.random() * 5000) + 100,
        profileImageUrl: `https://example.com/profiles/${id}.jpg`,
      };
    });

    // 정렬 로직
    if (sortBy) {
      mockStatistics.sort((a, b) => {
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
      statistics: mockStatistics,
      total: 100, // 예시 데이터
    };
  }
}
