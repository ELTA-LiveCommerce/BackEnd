import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryBuilder } from '@mikro-orm/postgresql';
import { Loaded } from '@mikro-orm/core';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { Broadcast } from './entity/broadcast.entity';
import { BroadcastProduct } from '../product/entity/broadcast-product.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { BroadcastListRequestDto } from '@/api/v2/seller/lives/dto/broadcast-list.request.dto';
import { BroadcastPagedResponseDto } from '@/api/v2/seller/lives/dto/broadcast-paged-response.dto';
import { BroadcastListItemDto } from './dto/broadcast-list-item.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastCreateRequestDto } from '@/api/v2/seller/lives/dto/broadcast-create.request.dto';

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(Broadcast)
    private readonly broadcastRepository: EntityRepository<Broadcast>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    private readonly em: EntityManager,
  ) {}

  async createBroadcast(dto: BroadcastCreateRequestDto, sellerId: string): Promise<BroadcastListItemDto> {
    return this.em.transactional(async (em) => {
      const seller = await em.findOne(User, { id: sellerId });
      if (!seller) {
        throw new NotFoundException(`Seller with ID ${sellerId} not found.`);
      }

      const broadcast = new Broadcast(seller, dto.title, new Date(dto.scheduledAt), dto.thumbnailImageUrl);
      broadcast.streamKey = `live_${uuidv4()}`;

      em.persist(broadcast);

      if (dto.productIds && dto.productIds.length > 0) {
        const products = await this.productRepository.find({ id: { $in: dto.productIds } });
        if (products.length !== dto.productIds.length) {
          const foundProductIds = products.map((p) => p.id);
          const notFoundProductIds = dto.productIds.filter((id) => !foundProductIds.includes(id));
          throw new BadRequestException(`Following product IDs not found: ${notFoundProductIds.join(', ')}`);
        }

        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const broadcastProduct = new BroadcastProduct();
          broadcastProduct.broadcast = broadcast;
          broadcastProduct.product = product;
          broadcastProduct.sortOrder = i;
          em.persist(broadcastProduct);
        }
      }

      const productInfos = broadcast.products.getItems().map((bp) => ({
        id: bp.product.id,
        name: bp.product.name,
      }));

      return new BroadcastListItemDto({
        id: broadcast.id,
        title: broadcast.title,
        status: 'SCHEDULED',
        thumbnailUrl: broadcast.thumbnailUrl,
        scheduledAt: broadcast.scheduledAt,
        products: productInfos,
      });
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

  async findBySellerId(sellerId: string): Promise<Broadcast[]> {
    return this.broadcastRepository.find(
      { seller: { id: sellerId } },
      {
        populate: ['products.product'],
        orderBy: { scheduledAt: 'DESC' },
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

    const countQb = qb.clone();

    qb.orderBy({ scheduledAt: 'DESC' }).offset(offset).limit(limit);

    const broadcasts = await qb.getResultList();
    const total = await countQb.getCount();

    const items = broadcasts.map(
      (b) =>
        new BroadcastListItemDto({
          id: b.id,
          title: b.title,
          thumbnailUrl: b.thumbnailUrl,
          scheduledAt: b.scheduledAt,
          products: [],
        }),
    );

    return new PagedResponseV2<BroadcastListItemDto>(items, total, page, limit);
  }

  // TODO: Update, Delete 메서드 추가
  // TODO: 방송 시작/종료, 상품 연동 등의 메서드 추가
}
