import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';

import { User } from '@/module/user/entity/user.entity';
import { UserService } from '@/module/user/user.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entity/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    private readonly em: EntityManager,
    private readonly userService: UserService,
  ) {}

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
   * @returns 업데이트된 상품 정보
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

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
   */
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.em.removeAndFlush(product);
  }
}
