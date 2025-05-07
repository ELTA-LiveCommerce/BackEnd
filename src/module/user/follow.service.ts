import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { FollowerResponseDto, FollowingResponseDto } from '@/module/user/dto/follow.dto';
import { Follow } from '@/module/user/entity/follow.entity';
import { User } from '@/module/user/entity/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: EntityRepository<Follow>,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 특정 사용자를 팔로우합니다.
   * @param followerId 팔로우를 하는 사용자 ID
   * @param followingId 팔로우 당하는 사용자 ID
   */
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    if (followerId === followingId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    // 팔로우 대상 사용자 확인
    const following = await this.userRepository.findOne({ id: followingId });
    if (!following) {
      throw new NotFoundException('팔로우하려는 사용자를 찾을 수 없습니다.');
    }

    // 이미 팔로우 중인지 확인
    const existingFollow = await this.followRepository.findOne({
      follower: { id: followerId },
      following: { id: followingId },
    });

    if (existingFollow) {
      throw new ConflictException('이미 팔로우하고 있는 사용자입니다.');
    }

    // 팔로우 관계 생성
    const follower = await this.userRepository.findOne({ id: followerId });
    if (!follower) {
      throw new NotFoundException('팔로워 사용자를 찾을 수 없습니다.');
    }

    const follow = new Follow();
    follow.follower = follower;
    follow.following = following;

    await this.em.persistAndFlush(follow);
    return follow;
  }

  /**
   * 특정 사용자 팔로우를 취소합니다.
   * @param followerId 팔로우를 취소하는 사용자 ID
   * @param followingId 팔로우 취소 대상 사용자 ID
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    // 팔로우 관계 확인
    const follow = await this.followRepository.findOne({
      follower: { id: followerId },
      following: { id: followingId },
    });

    if (!follow) {
      throw new NotFoundException('팔로우 관계를 찾을 수 없습니다.');
    }

    // 팔로우 관계 삭제
    await this.em.removeAndFlush(follow);
  }

  /**
   * 특정 사용자의 팔로워 목록을 조회합니다.
   * @param userId 사용자 ID
   * @param currentUserId 현재 로그인한 사용자 ID (선택)
   */
  async getFollowers(userId: string, currentUserId?: string): Promise<FollowerResponseDto[]> {
    const user = await this.userRepository.findOne({ id: userId }, { populate: ['followers.follower'] });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 사용자의 팔로워 목록 가져오기
    const followers = await this.followRepository.find({ following: { id: userId } }, { populate: ['follower'] });

    // 현재 사용자가 이 팔로워들을 팔로우하고 있는지 확인
    const result: FollowerResponseDto[] = [];
    for (const follow of followers) {
      const follower = follow.follower;
      let isFollowing = false;

      if (currentUserId) {
        // 현재 사용자가 이 팔로워를 팔로우하고 있는지 확인
        const relationship = await this.followRepository.findOne({
          follower: { id: currentUserId },
          following: { id: follower.id },
        });
        isFollowing = !!relationship;
      }

      result.push({
        id: follower.id,
        name: follower.name,
        email: follower.email,
        profileImage: follower.profileImage,
        isFollowing,
      });
    }

    return result;
  }

  /**
   * 특정 사용자가 팔로우하는 사용자 목록을 조회합니다.
   * @param userId 사용자 ID
   */
  async getFollowing(userId: string): Promise<FollowingResponseDto[]> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 사용자가 팔로우하는 목록 가져오기
    const following = await this.followRepository.find({ follower: { id: userId } }, { populate: ['following'] });

    return following.map((follow) => ({
      id: follow.following.id,
      name: follow.following.name,
      email: follow.following.email,
      profileImage: follow.following.profileImage,
    }));
  }

  /**
   * 팔로우 관계인지 확인합니다.
   * @param followerId 팔로워 ID
   * @param followingId 팔로잉 ID
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      follower: { id: followerId },
      following: { id: followingId },
    });

    return !!follow;
  }
}
