import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';

import { CreateProductDto } from './dto/create-product.dto';
import { GetProductListDto } from './dto/get-product-list.dto';
import { ProductListItemDto } from './dto/product-list-item.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entity/product.entity';
import { ViewerProductListRequestDto, ViewerProductSortBy } from '@/api/v2/viewer/product/product-request.dto';

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
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const qb = this.productRepository.createQueryBuilder('p').select(['p.*']).leftJoinAndSelect('p.seller', 's'); // 판매자 정보는 항상 필요하므로 join & select
    // .where({ status: ProductStatus.ACTIVE }); // 예시: 활성화된 상품만 조회. ProductStatus enum 필요

    if (query.searchQuery) {
      qb.andWhere({ name: { $like: `%${query.searchQuery}%` } }); // 상품명 검색
      // 필요시 설명 등 다른 필드에도 검색 조건 추가 가능
      // qb.orWhere({ description: { $like: `%${query.searchQuery}%` } });
    }

    // 정렬 조건
    switch (query.sortBy) {
      case ViewerProductSortBy.PRICE_ASC:
        qb.orderBy({ price: 'ASC' });
        break;
      case ViewerProductSortBy.PRICE_DESC:
        qb.orderBy({ price: 'DESC' });
        break;
      // TODO: ViewerProductSortBy.POPULARITY 인기순 정렬 로직 추가 (예: 판매량, 조회수 기준)
      case ViewerProductSortBy.LATEST:
      default:
        qb.orderBy({ createdAt: 'DESC' });
        break;
    }

    const totalQuery = qb.clone().count('p.id', true); // count() 메서드로 변경, alias 명시
    const itemsQuery = qb.limit(limit).offset(offset); // itemsQuery는 그대로 유지

    const [totalResult, items] = await Promise.all([
      totalQuery.execute('get'), // count 쿼리 실행
      itemsQuery.getResultList(), // 목록 쿼리 실행
    ]);

    const total = (totalResult as any).count; // count 결과에서 실제 개수 추출

    return { items, total, page, limit };
  }

  /**
   * Viewer용 특정 상품 상세 정보를 조회합니다.
   * @param id 상품 ID
   * @returns 상품 정보
   */
  async findOneForViewer(id: string): Promise<Product> {
    // module-relation-rules에 따라 상세 조회 시 seller 정보 populate
    const product = await this.productRepository.findOne({ id }, { populate: ['seller'] });

    if (!product) {
      throw new NotFoundException(`상품 ID ${id}를 찾을 수 없습니다.`);
    }
    // if (product.status !== ProductStatus.ACTIVE) { // 예시: 활성화된 상품만 조회 가능하도록
    //   throw new NotFoundException(`상품 ID ${id}를 찾을 수 없거나 비활성화된 상품입니다.`);
    // }

    return product;
  }
}
