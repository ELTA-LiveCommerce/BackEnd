import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateShippingAddressDto, UpdateShippingAddressDto } from './dto/shipping-address.dto';
import { ShippingAddress } from './entity/shipping-address.entity';
import { User } from './entity/user.entity';

@Injectable()
export class ShippingAddressService {
  constructor(
    @InjectRepository(ShippingAddress)
    private readonly shippingAddressRepository: EntityRepository<ShippingAddress>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 특정 사용자의 모든 배송지 정보를 조회합니다.
   * @param userId 사용자 ID
   * @returns 배송지 정보 목록
   */
  async findAllByUserId(userId: string): Promise<ShippingAddress[]> {
    return this.shippingAddressRepository.find(
      { user: { id: userId } },
      { orderBy: { isDefault: 'DESC', createdAt: 'DESC' } },
    );
  }

  /**
   * 특정 사용자의 기본 배송지 정보를 조회합니다.
   * @param userId 사용자 ID
   * @returns 기본 배송지 정보 또는 null
   */
  async findDefaultByUserId(userId: string): Promise<ShippingAddress | null> {
    return this.shippingAddressRepository.findOne({ user: { id: userId }, isDefault: true });
  }

  /**
   * 특정 배송지 정보를 ID로 조회합니다.
   * @param id 배송지 ID
   * @returns 배송지 정보
   */
  async findOne(id: string): Promise<ShippingAddress> {
    const address = await this.shippingAddressRepository.findOne({ id });
    if (!address) {
      throw new NotFoundException(`배송지 정보를 찾을 수 없습니다: ${id}`);
    }
    return address;
  }

  /**
   * 새로운 배송지 정보를 생성합니다.
   * @param userId 사용자 ID
   * @param createShippingAddressDto 배송지 생성 DTO
   * @returns 생성된 배송지 정보
   */
  async create(userId: string, createShippingAddressDto: CreateShippingAddressDto): Promise<ShippingAddress> {
    return this.em.transactional(async (em) => {
      const user = em.getReference(User, userId);

      // 만약 기본 배송지로 설정하는 경우 기존 기본 배송지를 해제
      if (createShippingAddressDto.isDefault) {
        const existingDefaultAddress = await this.shippingAddressRepository.findOne(
          { user: { id: userId }, isDefault: true },
          { populate: [] },
        );

        if (existingDefaultAddress) {
          existingDefaultAddress.isDefault = false;
          em.persist(existingDefaultAddress);
        }
      }

      // 신규 배송지 생성
      const shippingAddress = new ShippingAddress();
      shippingAddress.user = user;
      shippingAddress.address = createShippingAddressDto.address;
      shippingAddress.detailAddress = createShippingAddressDto.detailAddress;
      shippingAddress.zipCode = createShippingAddressDto.zipCode;
      shippingAddress.receiver = createShippingAddressDto.receiver;
      shippingAddress.receiverPhone = createShippingAddressDto.receiverPhone;
      shippingAddress.isDefault = createShippingAddressDto.isDefault ?? false;

      em.persist(shippingAddress);
      return shippingAddress;
    });
  }

  /**
   * 배송지 정보를 업데이트합니다.
   * @param id 배송지 ID
   * @param userId 사용자 ID (권한 확인용)
   * @param updateShippingAddressDto 배송지 수정 DTO
   * @returns 업데이트된 배송지 정보
   */
  async update(
    id: string,
    userId: string,
    updateShippingAddressDto: UpdateShippingAddressDto,
  ): Promise<ShippingAddress> {
    return this.em.transactional(async (em) => {
      const shippingAddress = await this.shippingAddressRepository.findOne({ id });
      if (!shippingAddress) {
        throw new NotFoundException(`배송지 정보를 찾을 수 없습니다: ${id}`);
      }

      // 권한 확인
      if (shippingAddress.user.id !== userId) {
        throw new NotFoundException(`배송지 정보를 찾을 수 없습니다: ${id}`);
      }

      // 만약 기본 배송지로 설정하는 경우 기존 기본 배송지를 해제
      if (updateShippingAddressDto.isDefault) {
        const existingDefaultAddress = await this.shippingAddressRepository.findOne(
          { user: { id: userId }, isDefault: true, id: { $ne: id } },
          { populate: [] },
        );

        if (existingDefaultAddress) {
          existingDefaultAddress.isDefault = false;
          em.persist(existingDefaultAddress);
        }
      }

      // 배송지 정보 업데이트
      if (updateShippingAddressDto.address !== undefined) {
        shippingAddress.address = updateShippingAddressDto.address;
      }
      if (updateShippingAddressDto.detailAddress !== undefined) {
        shippingAddress.detailAddress = updateShippingAddressDto.detailAddress;
      }
      if (updateShippingAddressDto.zipCode !== undefined) {
        shippingAddress.zipCode = updateShippingAddressDto.zipCode;
      }
      if (updateShippingAddressDto.receiver !== undefined) {
        shippingAddress.receiver = updateShippingAddressDto.receiver;
      }
      if (updateShippingAddressDto.receiverPhone !== undefined) {
        shippingAddress.receiverPhone = updateShippingAddressDto.receiverPhone;
      }
      if (updateShippingAddressDto.isDefault !== undefined) {
        shippingAddress.isDefault = updateShippingAddressDto.isDefault;
      }

      em.persist(shippingAddress);
      return shippingAddress;
    });
  }

  /**
   * 배송지 정보를 삭제합니다.
   * @param id 배송지 ID
   * @param userId 사용자 ID (권한 확인용)
   * @returns 성공 여부
   */
  async remove(id: string, userId: string): Promise<boolean> {
    const shippingAddress = await this.shippingAddressRepository.findOne({ id });
    if (!shippingAddress) {
      throw new NotFoundException(`배송지 정보를 찾을 수 없습니다: ${id}`);
    }

    // 권한 확인
    if (shippingAddress.user.id !== userId) {
      throw new NotFoundException(`배송지 정보를 찾을 수 없습니다: ${id}`);
    }

    await this.em.removeAndFlush(shippingAddress);
    return true;
  }
}
