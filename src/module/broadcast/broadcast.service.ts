import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryBuilder } from '@mikro-orm/postgresql';
import { Collection, Loaded } from '@mikro-orm/core';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { Broadcast } from './entity/broadcast.entity';
import { Stream } from './entity/stream.entity';
import { AgoraService } from '@/module/agora/agora.service';
import { BroadcastProduct, BroadcastProductStatus } from '../product/entity/broadcast-product.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { BroadcastListRequestDto } from '@/api/v2/seller/lives/dto/broadcast-list.request.dto';
import { BroadcastPagedResponseDto } from '@/api/v2/seller/lives/dto/broadcast-paged-response.dto';
import { BroadcastListItemDto } from './dto/broadcast-list-item.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { BroadcastCreateRequestDto } from '@/api/v2/seller/lives/dto/broadcast-create.request.dto';
import { v4 as uuid } from 'uuid';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class BroadcastService {
  constructor(
    @InjectRepository(Broadcast)
    private readonly broadcastRepository: EntityRepository<Broadcast>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    private readonly em: EntityManager,
    @InjectRepository(Stream) private readonly streamRepository: EntityRepository<Stream>,
    private readonly agora: AgoraService,
    // private readonly userService: UserService, // UserService가 필요할 경우
  ) {}

  async createBroadcast(dto: BroadcastCreateRequestDto, sellerId: string): Promise<BroadcastListItemDto> {
    return this.em.transactional(async (em) => {
      const seller = await em.findOne(User, { id: sellerId });
      if (!seller) {
        throw new NotFoundException(`Seller with ID ${sellerId} not found.`);
      }

      const broadcast = new Broadcast(seller, dto.title, new Date(dto.scheduledAt), dto.thumbnailImageUrl);

      em.persist(broadcast);

      if (dto.productIds && dto.productIds.length > 0) {
        const products = await this.productRepository.find({ id: { $in: dto.productIds } });
        if (products.length !== dto.productIds.length) {
          const foundProductIds = products.map((p) => p.id);
          const notFoundProductIds = dto.productIds.filter((id) => !foundProductIds.includes(id));
          throw new BadRequestException(`Following product IDs not found: ${notFoundProductIds.join(', ')}`);
        }

        broadcast.products = new Collection<BroadcastProduct>(broadcast);
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const broadcastProduct = new BroadcastProduct();
          broadcastProduct.broadcast = broadcast;
          broadcastProduct.product = product;
          broadcastProduct.sortOrder = i;
          broadcast.products.add(broadcastProduct);
          em.persist(broadcastProduct);
        }
      }

      console.log('Broadcast created:', broadcast.products);

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
    await this.em.populate(broadcasts, ['products.product']);
    const total = await countQb.getCount();

    const items = broadcasts.map(
      (b) =>
        new BroadcastListItemDto({
          id: b.id,
          title: b.title,
          thumbnailUrl: b.thumbnailUrl,
          scheduledAt: b.scheduledAt,
          products: b.products.getItems().map((bp) => ({
            id: bp.product.id,
            name: bp.product.name,
          })),
          isLive: b.isLive,
        }),
    );

    return new PagedResponseV2<BroadcastListItemDto>(items, total, page, limit);
  }

  // TODO: Update, Delete 메서드 추가
  // TODO: 방송 시작/종료, 상품 연동 등의 메서드 추가
  async start(hostUserId: string, broadcastId: string) {
    return this.em.transactional(async (em) => {
      // 방송 정보 조회
      const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['seller', 'stream'] });

      if (!broadcast) {
        throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
      }

      // 방송 소유자 확인
      if (broadcast.seller.id !== hostUserId) {
        throw new ForbiddenException('이 방송을 시작할 권한이 없습니다.');
      }

      // 이미 라이브 중인지 확인
      if (broadcast.isLive) {
        throw new BadRequestException('이미 라이브 중인 방송입니다.');
      }

      // 이미 생성된 스트림이 있는지 확인
      if (broadcast.stream) {
        throw new BadRequestException('이미 스트림이 생성되어 있는 방송입니다.');
      }

      // 방송 상태 업데이트
      broadcast.startLive();
      em.persist(broadcast);

      // 스트림 생성
      const channelId = uuid();
      const sellerRef = em.getReference(User, hostUserId);
      const stream = new Stream();
      stream.seller = sellerRef;
      stream.broadcast = broadcast;
      stream.id = channelId;

      em.persist(stream);

      // await this.agora.createGroup(channelId, hostUserId);

      // Agora 토큰 생성
      const rtcToken = this.agora.rtcTokenWithAccount(channelId, hostUserId, 'publisher');
      // const chatToken = this.agora.chatUserToken(hostUserId);

      return {
        broadcastId: broadcast.id,
        channelId,
        uid: hostUserId,
        rtcToken,
        chatToken: '',
        appId: process.env.AGORA_APP_ID,
        expireIn: 3600,
      };
    });
  }

  /** 방송 입장(시청자) ------------------------------------------------------- */
  async join(broadcastId: string, userId: string) {
    const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['stream'] });

    if (!broadcast) {
      throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
    }

    if (!broadcast.isLive) {
      throw new BadRequestException('라이브 중인 방송이 아닙니다.');
    }

    if (!broadcast.stream) {
      throw new BadRequestException('해당 방송의 스트림을 찾을 수 없습니다.');
    }

    const channelId = broadcast.stream.id;
    const rtcToken = this.agora.rtcTokenWithAccount(channelId, userId, 'subscriber');
    // const chatToken = this.agora.chatUserToken(userId);

    // await this.agora.addUser(channelId, userId);

    return {
      broadcastId: broadcast.id,
      channelId,
      uid: userId,
      rtcToken,
      chatToken: '',
      appId: process.env.AGORA_APP_ID,
      expireIn: 3600,
    };
  }

  /** 토큰 재발급 ------------------------------------------------------------ */
  async renew(broadcastId: string, uid: string, role: 'publisher' | 'subscriber') {
    const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['stream'] });

    if (!broadcast) {
      throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
    }

    if (!broadcast.stream) {
      throw new BadRequestException('해당 방송의 스트림을 찾을 수 없습니다.');
    }

    const channelId = broadcast.stream.id;
    const token = this.agora.rtcTokenWithAccount(channelId, uid, role);
    return { token, expireIn: 3600 };
  }

  renewChat(uid: string) {
    const token = this.agora.chatUserToken(uid);
    return { token, expireIn: 3600 };
  }

  /** 방송 종료 -------------------------------------------------------------- */
  async end(broadcastId: string, hostUserId: string) {
    return this.em.transactional(async (em) => {
      const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['seller', 'stream'] });

      if (!broadcast) {
        throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
      }

      // 방송 소유자 확인
      if (broadcast.seller.id !== hostUserId) {
        throw new ForbiddenException('이 방송을 종료할 권한이 없습니다.');
      }

      // 라이브 중인지 확인
      if (!broadcast.isLive) {
        throw new BadRequestException('라이브 중인 방송이 아닙니다.');
      }

      // 스트림이 있는지 확인
      if (!broadcast.stream) {
        throw new BadRequestException('활성화된 스트림이 없습니다.');
      }

      // await this.agora.deleteGroup(broadcast.stream.id);

      // 방송 상태 업데이트
      broadcast.endLive();
      em.persist(broadcast);

      // 스트림 종료 처리
      const stream = broadcast.stream;
      if (stream && !stream.endedAt) {
        stream.endedAt = new Date();
        em.persist(stream);
      }

      return { success: true, message: '방송이 성공적으로 종료되었습니다.' };
    });
  }

  async delete(broadcastId: string, hostUserId: string) {
    const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['seller', 'stream'] });

    if (!broadcast) {
      throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
    }

    if (broadcast.seller.id !== hostUserId) {
      throw new ForbiddenException('이 방송을 삭제할 권한이 없습니다.');
    }

    this.em.remove(broadcast);
    await this.em.flush();

    return { success: true, message: '방송이 성공적으로 삭제되었습니다.' };
  }

  /**
   * 현재 방송에서 판매 중인 상품을 가져옵니다.
   */
  async getCurrentSellingProduct(broadcastId: string): Promise<BroadcastProduct | null> {
    const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['stream'] });

    if (!broadcast) {
      throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
    }

    if (!broadcast.isLive) {
      throw new BadRequestException('현재 라이브 중인 방송이 아닙니다.');
    }

    if (!broadcast.stream) {
      throw new BadRequestException('해당 방송의 스트림을 찾을 수 없습니다.');
    }

    // currentSellingProduct가 null인 경우 null 반환
    if (!broadcast.stream.currentSellingProduct) {
      return null;
    }

    // 현재 판매 중인 상품의 상세 정보 조회
    return this.em.findOne(
      BroadcastProduct,
      { id: broadcast.stream.currentSellingProduct.id },
      {
        populate: ['product'],
      },
    );
  }

  /**
   * 방송에서 판매 중인 상품 목록을 조회합니다.
   */
  async getBroadcastProducts(broadcastId: string): Promise<BroadcastProduct[]> {
    const broadcast = await this.broadcastRepository.findOne({ id: broadcastId });

    if (!broadcast) {
      throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
    }

    // 방송에 연결된 모든 상품 조회 (sortOrder 기준 정렬)
    return this.em.find(
      BroadcastProduct,
      { broadcast: { id: broadcastId } },
      {
        populate: ['product'],
        orderBy: { sortOrder: 'ASC' },
      },
    );
  }

  /**
   * 방송에서 현재 판매 중인 상품을 변경합니다.
   */
  async updateCurrentSellingProduct(
    broadcastId: string,
    productId: string,
    sellerId: string,
  ): Promise<BroadcastProduct> {
    const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['seller', 'stream'] });

    if (!broadcast) {
      throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
    }

    // 방송 소유자 확인
    if (broadcast.seller.id !== sellerId) {
      throw new ForbiddenException('이 방송의 상품을 변경할 권한이 없습니다.');
    }

    if (!broadcast.isLive) {
      throw new BadRequestException('현재 라이브 중인 방송이 아닙니다.');
    }

    if (!broadcast.stream) {
      throw new BadRequestException('해당 방송의 스트림을 찾을 수 없습니다.');
    }

    // 방송에 연결된 상품인지 확인 (product ID로 BroadcastProduct 찾기)
    const broadcastProduct = await this.em.findOne(
      BroadcastProduct,
      {
        product: { id: productId },
        broadcast: { id: broadcastId },
      },
      { populate: ['product'] },
    );

    if (!broadcastProduct) {
      throw new NotFoundException(`해당 방송에 연결된 상품을 찾을 수 없습니다: ${productId}`);
    }

    // 기존에 판매 중인 상품이 있으면 상태 변경
    if (broadcast.stream.currentSellingProduct) {
      const currentProduct = await this.em.findOne(BroadcastProduct, {
        id: broadcast.stream.currentSellingProduct.id,
      });

      if (currentProduct) {
        currentProduct.status = BroadcastProductStatus.SOLD;
        this.em.persist(currentProduct);
      }
    }

    // 새로운 상품 상태 업데이트
    broadcastProduct.status = BroadcastProductStatus.SELLING;
    this.em.persist(broadcastProduct);

    // 스트림 정보 업데이트
    broadcast.stream.currentSellingProduct = broadcastProduct;
    this.em.persist(broadcast.stream);

    return broadcastProduct;
  }

  /**
   * 특정 방송에서 판매 중인 상품을 중지합니다.
   */
  async stopSellingProduct(broadcastId: string, sellerId: string): Promise<void> {
    const broadcast = await this.broadcastRepository.findOne({ id: broadcastId }, { populate: ['seller', 'stream'] });

    if (!broadcast) {
      throw new NotFoundException(`방송 ID ${broadcastId}를 찾을 수 없습니다.`);
    }

    // 방송 소유자 확인
    if (broadcast.seller.id !== sellerId) {
      throw new ForbiddenException('이 방송의 상품을 변경할 권한이 없습니다.');
    }

    if (!broadcast.isLive || !broadcast.stream) {
      throw new BadRequestException('현재 라이브 중인 방송이 아닙니다.');
    }

    // 현재 판매 중인 상품이 없으면 에러
    if (!broadcast.stream.currentSellingProduct) {
      throw new BadRequestException('현재 판매 중인 상품이 없습니다.');
    }

    // 현재 판매 중인 상품 조회
    const currentProduct = await this.em.findOne(BroadcastProduct, {
      id: broadcast.stream.currentSellingProduct.id,
    });

    if (currentProduct) {
      // 상품 상태 업데이트
      currentProduct.status = BroadcastProductStatus.STOPPED;
      this.em.persist(currentProduct);
    }

    // 스트림에서 현재 판매 상품 제거
    broadcast.stream.currentSellingProduct = undefined;
    this.em.persist(broadcast.stream);
  }
}

