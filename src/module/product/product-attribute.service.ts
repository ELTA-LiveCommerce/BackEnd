import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateProductAttributeDto, UpdateProductAttributeDto } from './dto/product-attribute.dto';
import { ProductAttribute } from './entity/product-attribute.entity';
import { Product } from './entity/product.entity';

@Injectable()
export class ProductAttributeService {
  constructor(
    @InjectRepository(ProductAttribute)
    private readonly attributeRepository: EntityRepository<ProductAttribute>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 새 상품 속성을 생성합니다.
   * @param createAttributeDto 속성 생성 DTO
   * @param productId 상품 ID
   * @returns 생성된 속성 정보
   */
  async create(createAttributeDto: CreateProductAttributeDto, productId: string): Promise<ProductAttribute> {
    const product = await this.productRepository.findOne({ id: productId });

    if (!product) {
      throw new NotFoundException(`상품 ID ${productId}를 찾을 수 없습니다.`);
    }

    const attribute = new ProductAttribute();
    attribute.product = product;
    attribute.name = createAttributeDto.name;
    attribute.value = createAttributeDto.value;

    if (createAttributeDto.sortOrder !== undefined) {
      attribute.sortOrder = createAttributeDto.sortOrder;
    }

    if (createAttributeDto.isVisible !== undefined) {
      attribute.isVisible = createAttributeDto.isVisible;
    }

    await this.em.persistAndFlush(attribute);
    return attribute;
  }

  /**
   * 특정 상품의 모든 속성 목록을 조회합니다.
   * @param productId 상품 ID
   * @returns 속성 목록
   */
  async findByProductId(productId: string): Promise<ProductAttribute[]> {
    const product = await this.productRepository.findOne({ id: productId });

    if (!product) {
      throw new NotFoundException(`상품 ID ${productId}를 찾을 수 없습니다.`);
    }

    return await this.attributeRepository.find({ product: product }, { orderBy: { sortOrder: 'ASC' } });
  }

  /**
   * ID로 속성을 조회합니다.
   * @param id 속성 ID
   * @returns 속성 정보
   */
  async findOne(id: string): Promise<ProductAttribute> {
    const attribute = await this.attributeRepository.findOne({ id }, { populate: ['product'] });

    if (!attribute) {
      throw new NotFoundException(`속성 ID ${id}를 찾을 수 없습니다.`);
    }

    return attribute;
  }

  /**
   * 속성을 업데이트합니다.
   * @param id 속성 ID
   * @param updateAttributeDto 속성 업데이트 DTO
   * @returns 업데이트된 속성 정보
   */
  async update(id: string, updateAttributeDto: UpdateProductAttributeDto): Promise<ProductAttribute> {
    const attribute = await this.findOne(id);

    if (updateAttributeDto.name !== undefined) {
      attribute.name = updateAttributeDto.name;
    }

    if (updateAttributeDto.value !== undefined) {
      attribute.value = updateAttributeDto.value;
    }

    if (updateAttributeDto.sortOrder !== undefined) {
      attribute.sortOrder = updateAttributeDto.sortOrder;
    }

    if (updateAttributeDto.isVisible !== undefined) {
      attribute.isVisible = updateAttributeDto.isVisible;
    }

    await this.em.flush();
    return attribute;
  }

  /**
   * 속성을 삭제합니다.
   * @param id 속성 ID
   */
  async remove(id: string): Promise<void> {
    const attribute = await this.findOne(id);
    await this.em.removeAndFlush(attribute);
  }

  /**
   * 특정 상품의 모든 속성을 일괄 생성합니다.
   * @param productId 상품 ID
   * @param attributeDtos 속성 생성 DTO 배열
   * @returns 생성된 속성 목록
   */
  async createBulk(productId: string, attributeDtos: CreateProductAttributeDto[]): Promise<ProductAttribute[]> {
    const product = await this.productRepository.findOne({ id: productId });

    if (!product) {
      throw new NotFoundException(`상품 ID ${productId}를 찾을 수 없습니다.`);
    }

    const attributes: ProductAttribute[] = [];

    for (const dto of attributeDtos) {
      const attribute = new ProductAttribute();
      attribute.product = product;
      attribute.name = dto.name;
      attribute.value = dto.value;

      if (dto.sortOrder !== undefined) {
        attribute.sortOrder = dto.sortOrder;
      }

      if (dto.isVisible !== undefined) {
        attribute.isVisible = dto.isVisible;
      }

      attributes.push(attribute);
    }

    await this.em.persistAndFlush(attributes);
    return attributes;
  }
}
