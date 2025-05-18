import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ViewLog } from './entity/view-log.entity';
import { EntityRepository } from '@mikro-orm/postgresql';
import { PurchaseLog } from '../order/entity/purchase-log.entity';
import { User } from '../user/entity/user.entity';
import { Broadcast } from './entity/broadcast.entity';
import { Product } from '../product/entity/product.entity';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(ViewLog)
    private readonly viewLogRepository: EntityRepository<ViewLog>,
    @InjectRepository(PurchaseLog)
    private readonly purchaseLogRepository: EntityRepository<PurchaseLog>,
    private readonly em: EntityManager,
  ) {}

  async findViewLogs(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, search, sortBy = 'viewedAt', sortOrder = 'desc' } = options;
    const qb = this.viewLogRepository.createQueryBuilder('vl');
    qb.leftJoinAndSelect('vl.viewer', 'viewer');
    qb.leftJoinAndSelect('vl.broadcast', 'broadcast');

    if (search) {
      const searchPattern = `%${search}%`;
      qb.andWhere('(viewer.name LIKE ?0 OR broadcast.title LIKE ?0)', [searchPattern]);
    }

    // 정렬 설정
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'viewerName') {
      qb.orderBy({ 'viewer.name': direction });
    } else if (sortBy === 'broadcastName') {
      qb.orderBy({ 'broadcast.title': direction });
    } else {
      qb.orderBy({ 'vl.viewedAt': direction });
    }

    const total = await qb.getCount();
    const items = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getResult();

    return { items, total };
  }

  async findPurchaseLogs(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, search, sortBy = 'purchasedAt', sortOrder = 'desc' } = options;
    const qb = this.purchaseLogRepository.createQueryBuilder('pl');
    qb.leftJoinAndSelect('pl.buyer', 'buyer');
    qb.leftJoinAndSelect('pl.product', 'product');

    if (search) {
      const searchPattern = `%${search}%`;
      qb.andWhere('(buyer.name LIKE ?0 OR product.name LIKE ?0)', [searchPattern]);
    }

    // 정렬 설정
    const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'buyerName') {
      qb.orderBy({ 'buyer.name': direction });
    } else if (sortBy === 'productName') {
      qb.orderBy({ 'product.name': direction });
    } else if (sortBy === 'price') {
      qb.orderBy({ 'pl.price': direction });
    } else if (sortBy === 'quantity') {
      qb.orderBy({ 'pl.quantity': direction });
    } else {
      qb.orderBy({ 'pl.purchasedAt': direction });
    }

    const total = await qb.getCount();
    const items = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getResult();

    return { items, total };
  }

  async createViewLog(viewerId: string, broadcastId: string): Promise<ViewLog> {
    const viewer = await this.em.findOne(User, viewerId);
    const broadcast = await this.em.findOne(Broadcast, broadcastId);

    if (!viewer || !broadcast) {
      throw new Error('사용자 또는 방송을 찾을 수 없습니다.');
    }

    const viewLog = new ViewLog(viewer, broadcast);
    await this.em.persistAndFlush(viewLog);
    return viewLog;
  }

  async createPurchaseLog(buyerId: string, productId: string, price: number, quantity: number): Promise<PurchaseLog> {
    const buyer = await this.em.findOne(User, buyerId);
    const product = await this.em.findOne(Product, productId);

    if (!buyer || !product) {
      throw new Error('사용자 또는 상품을 찾을 수 없습니다.');
    }

    const purchaseLog = new PurchaseLog(buyer, product, price, quantity);
    await this.em.persistAndFlush(purchaseLog);
    return purchaseLog;
  }
}

