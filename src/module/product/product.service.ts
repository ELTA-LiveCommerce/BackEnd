import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';

import { User } from '@/module/user/entity/user.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductAttribute } from './entity/product-attribute.entity';
import { Product } from './entity/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    @InjectRepository(ProductAttribute)
    private readonly attributeRepository: EntityRepository<ProductAttribute>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 새 상품을 생성합니다.
   * @param createProductDto 상품 생성 DTO
   * @param seller 판매자 정보 (현재 로그인한 사용자)
   * @returns 생성된 상품 정보
   */
  async create(createProductDto: CreateProductDto, seller: User): Promise<Product> {
    const product = new Product();

    // 기본 정보 설정
    product.name = createProductDto.name;
    product.description = createProductDto.description;
    product.price = createProductDto.price;
    product.stockQuantity = createProductDto.stockQuantity;
    product.seller = seller;

    // 선택적 필드 설정
    if (createProductDto.discountPrice !== undefined) {
      product.discountPrice = createProductDto.discountPrice;
    }

    if (createProductDto.discountRate !== undefined) {
      product.discountRate = createProductDto.discountRate;
    }

    if (createProductDto.status !== undefined) {
      product.status = createProductDto.status;
    }

    if (createProductDto.thumbnailUrl) {
      product.thumbnailUrl = createProductDto.thumbnailUrl;
    }

    if (createProductDto.images) {
      product.images = createProductDto.images;
    }

    if (createProductDto.externalId) {
      product.externalId = createProductDto.externalId;
    }

    if (createProductDto.productCode) {
      product.productCode = createProductDto.productCode;
    }

    if (createProductDto.shippingFee !== undefined) {
      product.shippingFee = createProductDto.shippingFee;
    }

    if (createProductDto.saleStartDate) {
      product.saleStartDate = createProductDto.saleStartDate;
    }

    if (createProductDto.saleEndDate) {
      product.saleEndDate = createProductDto.saleEndDate;
    }

    // 상품 저장
    await this.em.persistAndFlush(product);

    // 속성 추가 처리
    if (createProductDto.attributes && createProductDto.attributes.length > 0) {
      for (const attributeDto of createProductDto.attributes) {
        const attribute = new ProductAttribute();
        attribute.product = product;
        attribute.name = attributeDto.name;
        attribute.value = attributeDto.value;

        if (attributeDto.sortOrder !== undefined) {
          attribute.sortOrder = attributeDto.sortOrder;
        }

        if (attributeDto.isVisible !== undefined) {
          attribute.isVisible = attributeDto.isVisible;
        }

        product.attributes.add(attribute);
      }

      await this.em.flush();
    }

    return product;
  }

  /**
   * 모든 상품 목록을 조회합니다.
   * @returns 상품 목록
   */
  async findAll(): Promise<Product[]> {
    return await this.productRepository.findAll({
      populate: ['seller', 'attributes'],
    });
  }

  /**
   * ID로 상품을 조회합니다.
   * @param id 상품 ID
   * @returns 상품 정보
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ id }, { populate: ['seller', 'attributes'] });

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

    // 필드 업데이트
    if (updateProductDto.name !== undefined) {
      product.name = updateProductDto.name;
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

    if (updateProductDto.discountRate !== undefined) {
      product.discountRate = updateProductDto.discountRate;
    }

    if (updateProductDto.stockQuantity !== undefined) {
      product.stockQuantity = updateProductDto.stockQuantity;
    }

    if (updateProductDto.status !== undefined) {
      product.status = updateProductDto.status;
    }

    if (updateProductDto.thumbnailUrl !== undefined) {
      product.thumbnailUrl = updateProductDto.thumbnailUrl;
    }

    if (updateProductDto.images !== undefined) {
      product.images = updateProductDto.images;
    }

    if (updateProductDto.externalId !== undefined) {
      product.externalId = updateProductDto.externalId;
    }

    if (updateProductDto.productCode !== undefined) {
      product.productCode = updateProductDto.productCode;
    }

    if (updateProductDto.shippingFee !== undefined) {
      product.shippingFee = updateProductDto.shippingFee;
    }

    if (updateProductDto.saleStartDate !== undefined) {
      product.saleStartDate = updateProductDto.saleStartDate;
    }

    if (updateProductDto.saleEndDate !== undefined) {
      product.saleEndDate = updateProductDto.saleEndDate;
    }

    // 새로운 속성 추가
    if (updateProductDto.attributes && updateProductDto.attributes.length > 0) {
      for (const attributeDto of updateProductDto.attributes) {
        const attribute = new ProductAttribute();
        attribute.product = product;
        attribute.name = attributeDto.name;
        attribute.value = attributeDto.value;

        if (attributeDto.sortOrder !== undefined) {
          attribute.sortOrder = attributeDto.sortOrder;
        }

        if (attributeDto.isVisible !== undefined) {
          attribute.isVisible = attributeDto.isVisible;
        }

        product.attributes.add(attribute);
      }
    }

    // 기존 속성 업데이트
    if (updateProductDto.attributeUpdates && updateProductDto.attributeUpdates.length > 0) {
      for (const attributeUpdate of updateProductDto.attributeUpdates) {
        const attribute = await this.attributeRepository.findOne({ id: attributeUpdate.id });

        if (attribute && attribute.product.id === product.id) {
          if (attributeUpdate.updates.name !== undefined) {
            attribute.name = attributeUpdate.updates.name;
          }

          if (attributeUpdate.updates.value !== undefined) {
            attribute.value = attributeUpdate.updates.value;
          }

          if (attributeUpdate.updates.sortOrder !== undefined) {
            attribute.sortOrder = attributeUpdate.updates.sortOrder;
          }

          if (attributeUpdate.updates.isVisible !== undefined) {
            attribute.isVisible = attributeUpdate.updates.isVisible;
          }
        }
      }
    }

    // 속성 삭제
    if (updateProductDto.attributeIdsToRemove && updateProductDto.attributeIdsToRemove.length > 0) {
      for (const attributeId of updateProductDto.attributeIdsToRemove) {
        const attribute = await this.attributeRepository.findOne({ id: attributeId });

        if (attribute && attribute.product.id === product.id) {
          product.attributes.remove(attribute);
          await this.em.removeAndFlush(attribute);
        }
      }
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
