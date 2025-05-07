import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { FollowUserDto, FollowerResponseDto, FollowingResponseDto } from '@/module/user/dto/follow.dto';
import { FollowService } from '@/module/user/follow.service';

// 요청 사용자 정보를 포함하는 커스텀 인터페이스 정의
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('users')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  /**
   * 사용자를 팔로우합니다.
   * 인증이 필요한 엔드포인트입니다.
   */
  @Post('follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async followUser(@Req() req: RequestWithUser, @Body() followUserDto: FollowUserDto): Promise<{ message: string }> {
    await this.followService.followUser(req.user.id, followUserDto.userId);
    return { message: '팔로우가 완료되었습니다.' };
  }

  /**
   * 사용자 팔로우를 취소합니다.
   * 인증이 필요한 엔드포인트입니다.
   */
  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollowUser(@Req() req: RequestWithUser, @Param('userId') userId: string): Promise<{ message: string }> {
    await this.followService.unfollowUser(req.user.id, userId);
    return { message: '팔로우가 취소되었습니다.' };
  }

  /**
   * 특정 사용자의 팔로워 목록을 조회합니다.
   * 인증이 필요한 엔드포인트입니다.
   */
  @Get(':userId/followers')
  @UseGuards(JwtAuthGuard)
  async getFollowers(@Req() req: RequestWithUser, @Param('userId') userId: string): Promise<FollowerResponseDto[]> {
    return this.followService.getFollowers(userId, req.user.id);
  }

  /**
   * 특정 사용자가 팔로우하는 사용자 목록을 조회합니다.
   * 인증이 필요한 엔드포인트입니다.
   */
  @Get(':userId/following')
  @UseGuards(JwtAuthGuard)
  async getFollowing(@Param('userId') userId: string): Promise<FollowingResponseDto[]> {
    return this.followService.getFollowing(userId);
  }

  /**
   * 두 사용자 간의 팔로우 관계를 확인합니다.
   * 인증이 필요한 엔드포인트입니다.
   */
  @Get(':userId/is-following/:targetId')
  @UseGuards(JwtAuthGuard)
  async isFollowing(
    @Param('userId') userId: string,
    @Param('targetId') targetId: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.followService.isFollowing(userId, targetId);
    return { isFollowing };
  }

  /**
   * 로그인한 사용자가 특정 사용자를 팔로우하고 있는지 확인합니다.
   * 인증이 필요한 엔드포인트입니다.
   */
  @Get('is-following/:targetId')
  @UseGuards(JwtAuthGuard)
  async isCurrentUserFollowing(
    @Req() req: RequestWithUser,
    @Param('targetId') targetId: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.followService.isFollowing(req.user.id, targetId);
    return { isFollowing };
  }
}
