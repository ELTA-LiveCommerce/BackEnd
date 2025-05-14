import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { QueryOrder, RequestContext, wrap } from '@mikro-orm/core';
import { EntityManager, QueryBuilder } from '@mikro-orm/postgresql';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';

import { CreateProductDto } from './dto/create-product.dto';
import { GetProductListDto } from './dto/get-product-list.dto';
import { ProductListItemDto } from './dto/product-list-item.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entity/product.entity';
import { ViewerProductListRequestDto, ViewerProductSortBy } from '@/api/v2/viewer/product/product-request.dto';
import {
  SellerProductCreateRequestDto,
  SellerProductUpdateRequestDto,
  SellerProductListRequestDto,
} from '@/api/v2/seller/product/product.request.dto';
import { SellerProductSearchField } from '@/api/v2/seller/product/search-field.enum';
import { SellerProductDateField } from '@/api/v2/seller/product/date-field.enum';
import { BaseRepository } from '@/shared/common/base.repository';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { SellerProductListItemDto } from './dto/seller-product-list-item.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    private readonly em: EntityManager,
    private readonly userService: UserService,
  ) {}

  /**
   * 셀러의 상품 목록을 조회합니다.
   * @param getProductListDto 상품 목록 조회 DTO
   * @param seller 현재 로그인한 셀러 정보
   * @returns 상품 목록
   */
  async getSellerProductList(getProductListDto: GetProductListDto, seller: User): Promise<ProductListItemDto[]> {
    const where: any = {
      seller: { id: seller.id },
    };

    // 검색어가 있는 경우 검색 조건 추가
    if (getProductListDto.search) {
      where.name = { $like: `%${getProductListDto.search}%` };
    }

    const products = await this.productRepository.find(where, {
      orderBy: { createdAt: 'DESC' },
    });

    // 응답 DTO로 변환
    return products.map((product) => this.mapToProductListItem(product));
  }

  /**
   * 셀러의 상품 상세 정보를 조회합니다.
   * @param id 상품 ID
   * @param seller 현재 로그인한 셀러 정보
   * @returns 상품 정보
   */
  async getSellerProductDetail(id: string, seller: User): Promise<Product> {
    const product = await this.findOne(id);

    // 자신의 상품인지 확인
    if (product.seller.id !== seller.id) {
      throw new ForbiddenException('자신의 상품만 조회할 수 있습니다.');
    }

    return product;
  }

  /**
   * 상품 목록을 관리 페이지용으로 조회합니다.
   * @param getProductListDto 상품 목록 조회 DTO
   * @returns 상품 목록
   */
  async getProductListForManagement(getProductListDto: GetProductListDto): Promise<ProductListItemDto[]> {
    const where: any = {};

    // 검색어가 있는 경우 검색 조건 추가
    if (getProductListDto.search) {
      where.name = { $like: `%${getProductListDto.search}%` };
    }

    const products = await this.productRepository.find(where, {
      orderBy: { createdAt: 'DESC' },
    });

    // 관리 페이지용 응답 DTO로 변환
    return products.map((product) => this.mapToProductListItem(product));
  }

  /**
   * 상품 정보를 관리 페이지용으로 상세 조회합니다.
   * @param id 상품 ID
   * @returns 상품 정보
   */
  async getProductDetailForManagement(id: string): Promise<Product> {
    const product = await this.findOne(id);
    return product;
  }

  /**
   * Product 엔티티를 ProductListItemDto로 변환합니다.
   * @param product 상품 엔티티
   * @returns 상품 목록 아이템 DTO
   */
  private mapToProductListItem(product: Product): ProductListItemDto {
    const dto = new ProductListItemDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.price = product.price;
    dto.discountPrice = product.discountPrice;
    dto.stockQuantity = product.stockQuantity;
    dto.mainImage = product.mainImage;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }

  /**
   * 새 상품을 생성합니다.
   * @param createProductDto 상품 생성 DTO
   * @param seller 판매자 정보 (현재 로그인한 사용자)
   * @returns 생성된 상품 정보
   */
  async create(createProductDto: CreateProductDto, seller: User): Promise<Product> {
    const product = new Product();

    // 필수 정보 설정
    product.name = createProductDto.name;
    product.description = createProductDto.description;
    product.price = createProductDto.price;
    product.stockQuantity = createProductDto.stockQuantity;
    product.seller = seller;

    // 옵션 정보 설정
    if (createProductDto.shortDescription) {
      product.shortDescription = createProductDto.shortDescription;
    }
    if (createProductDto.mainImage) {
      product.mainImage = createProductDto.mainImage;
    }
    if (createProductDto.images) {
      product.images = createProductDto.images;
    }
    if (createProductDto.discountPrice !== undefined) {
      product.discountPrice = createProductDto.discountPrice;
    }

    await this.em.persistAndFlush(product);
    return product;
  }

  /**
   * 모든 상품 목록을 조회합니다.
   * @returns 상품 목록
   */
  async findAll(): Promise<Product[]> {
    return await this.productRepository.findAll({
      populate: ['seller'],
    });
  }

  /**
   * 특정 판매자의 모든 상품 목록을 조회합니다.
   * @param sellerId 판매자 ID
   * @returns 상품 목록
   */
  async findProductsBySeller(sellerId: string): Promise<Product[]> {
    await this.userService.findOne(sellerId);
    return await this.productRepository.find({ seller: { id: sellerId } }, { populate: ['seller'] });
  }

  /**
   * ID로 상품을 조회합니다.
   * @param id 상품 ID
   * @returns 상품 정보
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ id }, { populate: ['seller'] });

    if (!product) {
      throw new NotFoundException(`상품 ID ${id}를 찾을 수 없습니다.`);
    }

    return product;
  }

  /**
   * 상품을 업데이트합니다.
   * @param id 상품 ID
   * @param updateProductDto 상품 업데이트 DTO
   * @param seller 현재 로그인한 셀러 정보
   * @returns 업데이트된 상품 정보
   */
  async update(id: string, updateProductDto: UpdateProductDto, seller?: User): Promise<Product> {
    const product = await this.findOne(id);

    // 자신의 상품인지 확인 (seller가 제공된 경우)
    if (seller && product.seller.id !== seller.id) {
      throw new ForbiddenException('자신의 상품만 수정할 수 있습니다.');
    }

    // 필드 업데이트 (존재하는 경우에만)
    if (updateProductDto.name !== undefined) {
      product.name = updateProductDto.name;
    }
    if (updateProductDto.shortDescription !== undefined) {
      product.shortDescription = updateProductDto.shortDescription;
    }
    if (updateProductDto.description !== undefined) {
      product.description = updateProductDto.description;
    }
    if (updateProductDto.price !== undefined) {
      product.price = updateProductDto.price;
    }
    if (updateProductDto.discountPrice !== undefined) {
      product.discountPrice = updateProductDto.discountPrice;
    }
    if (updateProductDto.stockQuantity !== undefined) {
      product.stockQuantity = updateProductDto.stockQuantity;
    }
    if (updateProductDto.mainImage !== undefined) {
      product.mainImage = updateProductDto.mainImage;
    }
    if (updateProductDto.images !== undefined) {
      product.images = updateProductDto.images;
    }

    await this.em.flush();
    return product;
  }

  /**
   * 상품을 삭제합니다.
   * @param id 상품 ID
   * @param seller 현재 로그인한 셀러 정보
   */
  async remove(id: string, seller?: User): Promise<void> {
    const product = await this.findOne(id);

    // 자신의 상품인지 확인 (seller가 제공된 경우)
    if (seller && product.seller.id !== seller.id) {
      throw new ForbiddenException('자신의 상품만 삭제할 수 있습니다.');
    }

    await this.em.removeAndFlush(product);
  }

  /**
   * 상품의 할인 가격을 설정합니다.
   * @param id 상품 ID
   * @param discountPrice 설정할 할인 가격
   * @param seller 현재 로그인한 셀러 정보
   * @returns 업데이트된 상품 정보
   */
  async setProductDiscount(id: string, discountPrice: number, seller?: User): Promise<Product> {
    const product = await this.findOne(id);

    // 자신의 상품인지 확인 (seller가 제공된 경우)
    if (seller && product.seller.id !== seller.id) {
      throw new ForbiddenException('자신의 상품만 할인 설정할 수 있습니다.');
    }

    // 할인 가격이 원래 가격보다 높은 경우 검증
    if (discountPrice > product.price) {
      throw new ForbiddenException('할인 가격은 원래 가격보다 낮아야 합니다.');
    }

    // 할인 가격 설정
    product.discountPrice = discountPrice;

    await this.em.flush();
    return product;
  }

  /**
   * 상품의 할인을 제거합니다.
   * @param id 상품 ID
   * @param seller 현재 로그인한 셀러 정보
   * @returns 업데이트된 상품 정보
   */
  async removeProductDiscount(id: string, seller?: User): Promise<Product> {
    const product = await this.findOne(id);

    // 자신의 상품인지 확인 (seller가 제공된 경우)
    if (seller && product.seller.id !== seller.id) {
      throw new ForbiddenException('자신의 상품만 할인 제거할 수 있습니다.');
    }

    // 할인 가격 제거
    product.discountPrice = undefined;

    await this.em.flush();
    return product;
  }

  /**
   * Viewer용 상품 목록을 조회합니다.
   * @param query ViewerProductListRequestDto
   * @returns 상품 목록 및 전체 개수
   */
  async findAllForViewer(
    query: ViewerProductListRequestDto,
  ): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const qb = this.em.createQueryBuilder(Product, 'p').select(['p.*']).leftJoinAndSelect('p.seller', 's');

    if (query.searchQuery) {
      qb.andWhere({ name: { $like: `%${query.searchQuery}%` } });
    }

    switch (query.sortBy) {
      case ViewerProductSortBy.PRICE_ASC:
        qb.orderBy({ price: 'ASC' });
        break;
      case ViewerProductSortBy.PRICE_DESC:
        qb.orderBy({ price: 'DESC' });
        break;
      case ViewerProductSortBy.LATEST:
      default:
        qb.orderBy({ createdAt: 'DESC' });
        break;
    }

    const totalQuery = qb.clone().count('p.id', true);
    const itemsQuery = qb.limit(limit).offset(offset);

    const [totalResult, items] = await Promise.all([totalQuery.execute('get'), itemsQuery.getResultList()]);

    const total = (totalResult as any).count;

    return { items, total, page, limit };
  }

  /**
   * Viewer용 특정 상품 상세 정보를 조회합니다.
   * @param id 상품 ID
   * @returns 상품 정보
   */
  async findOneForViewer(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ id }, { populate: ['seller'] });

    if (!product) {
      throw new NotFoundException(`상품 ID ${id}를 찾을 수 없습니다.`);
    }

    return product;
  }

  /**
   * V2 API: 판매자 상품 생성
   */
  async createSellerProduct(sellerId: string, createDto: SellerProductCreateRequestDto): Promise<Product> {
    const seller = await this.userService.findOne(sellerId);
    if (!seller) {
      throw new NotFoundException('Seller not found.');
    }

    const product = new Product();
    product.name = createDto.name;
    product.price = createDto.price;
    product.stockQuantity = createDto.stockQuantity;
    product.description = createDto.description;
    product.seller = seller;

    if (createDto.shortDescription) product.shortDescription = createDto.shortDescription;
    if (createDto.mainImage) product.mainImage = createDto.mainImage;
    if (createDto.images) product.images = createDto.images;

    await this.productRepository.persistAndFlush(product);
    return product;
  }

  /**
   * V2 API: 판매자 상품 수정
   */
  @Transactional()
  async updateSellerProduct(
    sellerId: string,
    productId: string,
    updateDto: SellerProductUpdateRequestDto,
  ): Promise<Product> {
    const product = await this.findOne(productId);

    if (product.seller.id !== sellerId) {
      throw new ForbiddenException('You can only update your own products.');
    }

    if (updateDto.name !== undefined) product.name = updateDto.name;
    if (updateDto.price !== undefined) product.price = updateDto.price;
    if (updateDto.stockQuantity !== undefined) product.stockQuantity = updateDto.stockQuantity;
    if (updateDto.shortDescription !== undefined) product.shortDescription = updateDto.shortDescription;
    if (updateDto.description !== undefined) product.description = updateDto.description;
    if (updateDto.mainImage !== undefined) product.mainImage = updateDto.mainImage;
    if (updateDto.images !== undefined) product.images = updateDto.images;

    await this.productRepository.flush();
    return product;
  }

  /**
   * V2 API: 판매자 상품 목록 조회 (페이지네이션 및 필터링)
   */
  @Transactional()
  async findSellerProductsPaged(
    userId: string,
    query: SellerProductListRequestDto,
  ): Promise<PagedResponseV2<SellerProductListItemDto>> {
    const qb: QueryBuilder<Product> = this.em
      .createQueryBuilder(Product, 'p')
      .select([
        'p.id',
        'p.name',
        'p.price',
        'p.discountPrice',
        'p.stockQuantity',
        'p.mainImage',
        'p.createdAt',
        'p.updatedAt',
        'p.deletedAt',
      ])
      .where({ seller: { id: userId } });

    if (query.searchKeyword) {
      switch (query.searchField) {
        case SellerProductSearchField.NAME:
          qb.andWhere({ name: { $like: `%${query.searchKeyword}%` } });
          break;
        case SellerProductSearchField.DESCRIPTION:
          qb.andWhere({ description: { $like: `%${query.searchKeyword}%` } });
          break;
      }
    }

    const dateFieldMap = {
      [SellerProductDateField.CREATED_AT]: 'createdAt',
      [SellerProductDateField.UPDATED_AT]: 'updatedAt',
    };
    const dateField = dateFieldMap[query.dateField ?? SellerProductDateField.CREATED_AT];
    if (query.startDate) {
      qb.andWhere({ [`${dateField} >=`]: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere({ [`${dateField} <=`]: query.endDate });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    qb.orderBy({ [dateField]: QueryOrder.DESC });

    const countQb = qb.clone().count('p.id', true);
    qb.limit(limit).offset(offset);

    const [productMaps, totalResult] = await Promise.all([qb.getResult(), countQb.execute('get')]);
    const total = totalResult.count;

    const items = productMaps.map((map: any) => {
      return SellerProductListItemDto.fromEntity(map as Product);
    });

    return PagedResponseV2.create(items, total, page, limit);
  }
}
