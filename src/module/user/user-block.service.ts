import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { User } from './entity/user.entity';
import { SellerUserBlock, BlockType } from './entity/seller-user-block.entity';

@Injectable()
export class UserBlockService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(User) private readonly userRepository: EntityRepository<User>,
    @InjectRepository(SellerUserBlock) private readonly sellerUserBlockRepository: EntityRepository<SellerUserBlock>,
  ) {}

  /**
   * 셀러가 특정 사용자를 차단합니다.
   * 이미 차단된 경우, 사유만 업데이트될 수 있습니다 (선택적 구현).
   */
  async blockUser(
    sellerId: string,
    userIdToBlock: string,
    blockType: BlockType,
    reason?: string,
  ): Promise<SellerUserBlock> {
    const seller = await this.userRepository.findOne({ id: sellerId });
    if (!seller) {
      throw new NotFoundException('Seller not found.');
    }
    // TODO: 셀러 역할 확인 로직 (필요시)

    const userToBlock = await this.userRepository.findOne({ id: userIdToBlock });
    if (!userToBlock) {
      throw new NotFoundException('User to block not found.');
    }

    if (seller.id === userToBlock.id) {
      throw new ForbiddenException('Cannot block yourself.');
    }

    let block = await this.sellerUserBlockRepository.findOne({ seller, blockedUser: userToBlock });

    if (block) {
      this.em.assign(block, { isBlocked: true, type: blockType, reason });
    } else {
      block = new SellerUserBlock(seller, userToBlock, blockType, reason);
    }

    await this.em.persistAndFlush(block);
    return block;
  }

  /**
   * 셀러가 특정 사용자를 차단 해제합니다.
   */
  async unblockUser(sellerId: string, userIdToUnblock: string): Promise<void> {
    const seller = await this.userRepository.findOne({ id: sellerId });
    if (!seller) {
      throw new NotFoundException('Seller not found.');
    }

    const userToUnblock = await this.userRepository.findOne({ id: userIdToUnblock });
    if (!userToUnblock) {
      throw new NotFoundException('User to unblock not found.');
    }

    const block = await this.sellerUserBlockRepository.findOne({ seller, blockedUser: userToUnblock, isBlocked: true });

    if (!block) {
      // 이미 차단되지 않았거나, 차단 기록이 없는 경우
      throw new NotFoundException('User is not currently blocked by this seller.');
    }

    block.isBlocked = false;
    // block.reason = 'Unblocked'; // 필요시 사유 업데이트
    await this.em.persistAndFlush(block);
  }

  /**
   * 특정 셀러가 특정 사용자를 차단했는지 확인합니다.
   */
  async isUserBlockedBySeller(sellerId: string, userId: string): Promise<boolean> {
    const block = await this.sellerUserBlockRepository.findOne({
      seller: { id: sellerId },
      blockedUser: { id: userId },
      isBlocked: true,
    });
    return !!block;
  }

  /**
   * 특정 셀러가 차단한 사용자 목록 (차단 관계 엔티티)을 가져옵니다.
   * blockedUser 정보가 populate되어 반환됩니다.
   * TODO: 페이지네이션 등 고려
   */
  async getBlockedUsersBySeller(sellerId: string): Promise<SellerUserBlock[]> {
    return this.sellerUserBlockRepository.find(
      { seller: { id: sellerId }, isBlocked: true },
      { populate: ['blockedUser'] },
    );
  }

  /**
   * 특정 사용자를 차단한 셀러 목록 (차단 관계 엔티티)을 가져옵니다. (역방향 조회, 필요시 사용)
   * seller 정보가 populate되어 반환됩니다.
   * TODO: 페이지네이션 등 고려
   */
  async getBlockingSellersOfUser(userId: string): Promise<SellerUserBlock[]> {
    return this.sellerUserBlockRepository.find(
      { blockedUser: { id: userId }, isBlocked: true },
      { populate: ['seller'] },
    );
  }
}
