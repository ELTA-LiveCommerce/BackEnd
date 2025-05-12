import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryBuilder } from '@mikro-orm/postgresql'; // 또는 사용하는 DB에 맞게
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 } from 'uuid';

import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { Broadcast } from './entity/broadcast.entity';
import { BroadcastProduct } from '../product/entity/broadcast-product.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { BroadcastListRequestDto } from '@/api/v2/seller/lives/dto/broadcast-list.request.dto';
import { BroadcastPagedResponseDto } from '@/api/v2/seller/lives/dto/broadcast-paged-response.dto';
import { BroadcastListItemDto } from './dto/broadcast-list-item.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
// import { User } from '@/module/user/entity/user.entity'; // User 엔티티가 필요할 경우

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(Broadcast)
    private readonly broadcastRepository: EntityRepository<Broadcast>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    @InjectRepository(BroadcastProduct)
    private readonly broadcastProductRepository: EntityRepository<BroadcastProduct>,
    private readonly em: EntityManager,
    // private readonly userService: UserService, // UserService가 필요할 경우
  ) {}

  async create(createBroadcastDto: CreateBroadcastDto, seller: User): Promise<Broadcast> {
    // 트랜잭션 시작
    return this.em.transactional(async (em) => {
      // 방송 생성 - 생성자에 DTO의 scheduledDate 전달
      const broadcast = new Broadcast(
        seller,
        createBroadcastDto.title,
        createBroadcastDto.scheduledDate, // DTO의 scheduledDate를 생성자에 전달
      );
      // 생성자에서 처리되지 않은 추가 속성 설정
      // broadcast.id = v4(); // BaseEntity가 ID를 처리하도록 함 (필요 시)
      broadcast.description = createBroadcastDto.description;
      broadcast.thumbnailImage = createBroadcastDto.thumbnailImage;
      broadcast.streamKey = `stream-${v4()}`; // 유니크한 스트림 키 생성
      broadcast.isLive = createBroadcastDto.isLive ?? false;

      em.persist(broadcast);

      // 상품 연결
      if (createBroadcastDto.products && createBroadcastDto.products.length > 0) {
        for (let i = 0; i < createBroadcastDto.products.length; i++) {
          const productDto = createBroadcastDto.products[i];

          // 상품 존재 여부 확인
          const product = await this.productRepository.findOne({ id: productDto.productId });
          if (!product) {
            throw new NotFoundException(`상품을 찾을 수 없습니다: ${productDto.productId}`);
          }

          // 방송-상품 연결 생성
          const broadcastProduct = new BroadcastProduct();
          broadcastProduct.broadcast = broadcast;
          broadcastProduct.product = product;
          broadcastProduct.sortOrder = i;
          broadcastProduct.specialPrice = productDto.specialPrice;
          broadcastProduct.broadcastDescription = productDto.broadcastDescription;

          em.persist(broadcastProduct);
        }
      }

      // 트랜잭션 종료 및 반환
      return broadcast;
    });
  }

  async findAll(): Promise<Broadcast[]> {
    return this.broadcastRepository.findAll({
      populate: ['seller', 'products.product'],
    });
  }

  async findOne(id: string): Promise<Broadcast> {
    const broadcast = await this.broadcastRepository.findOne({ id }, { populate: ['seller', 'products.product'] });

    if (!broadcast) {
      throw new NotFoundException(`방송을 찾을 수 없습니다: ${id}`);
    }

    return broadcast;
  }

  /**
   * 특정 셀러의 모든 방송 목록을 조회합니다.
   * @param sellerId 셀러 ID
   * @returns 셀러의 방송 목록
   */
  async findBySellerId(sellerId: string): Promise<Broadcast[]> {
    return this.broadcastRepository.find(
      { seller: { id: sellerId } },
      {
        populate: ['products.product'],
        orderBy: { scheduledAt: 'DESC' }, // Corrected property name
      },
    );
  }

  async findSellerBroadcastsPaged(
    sellerId: string,
    query: BroadcastListRequestDto,
  ): Promise<PagedResponseV2<BroadcastListItemDto>> {
    const { page = 1, limit = 10, keyword, startDate, endDate } = query;
    const offset = (page - 1) * limit;

    const qb: QueryBuilder<Broadcast> = this.broadcastRepository.createQueryBuilder('b');

    qb.where({ seller: sellerId });

    if (keyword) {
      qb.andWhere({ title: { $like: `%${keyword}%` } });
    }

    if (startDate) {
      qb.andWhere({ scheduledAt: { $gte: new Date(startDate) } });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      qb.andWhere({ scheduledAt: { $lt: end } });
    }

    // Create a separate query for counting before applying offset/limit
    const countQb = qb.clone();

    // TODO: Add relations to fetch (e.g., products)
    // qb.leftJoinAndSelect('b.products', 'p');

    qb.orderBy({ scheduledAt: 'DESC' }).offset(offset).limit(limit);

    const broadcasts = await qb.getResultList();
    const total = await countQb.getCount();

    // TODO: Map broadcasts to BroadcastListItemDto, including product info
    const items = broadcasts.map(
      (b) =>
        new BroadcastListItemDto({
          id: b.id,
          title: b.title,
          thumbnailUrl: b.thumbnailUrl,
          scheduledAt: b.scheduledAt,
          products: [], // Placeholder
        }),
    );

    return new PagedResponseV2<BroadcastListItemDto>(items, total, page, limit);
  }

  // TODO: Update, Delete 메서드 추가
  // TODO: 방송 시작/종료, 상품 연동 등의 메서드 추가
}
