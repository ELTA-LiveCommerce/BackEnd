import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql'; // 또는 사용하는 DB에 맞게
import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 } from 'uuid';

import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { Broadcast } from './entity/broadcast.entity';
import { BroadcastProduct } from '../product/entity/broadcast-product.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
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
      // 방송 생성
      const broadcast = new Broadcast();
      broadcast.id = v4();
      broadcast.title = createBroadcastDto.title;
      broadcast.description = createBroadcastDto.description;
      broadcast.scheduledDate = createBroadcastDto.scheduledDate;
      broadcast.thumbnailImage = createBroadcastDto.thumbnailImage;
      broadcast.seller = seller;
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
        orderBy: { scheduledDate: 'DESC' },
      },
    );
  }

  // TODO: Update, Delete 메서드 추가
  // TODO: 방송 시작/종료, 상품 연동 등의 메서드 추가
}
