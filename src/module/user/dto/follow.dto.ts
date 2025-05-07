import { IsUUID } from 'class-validator';

export class FollowUserDto {
  @IsUUID(4)
  userId: string;
}

export class FollowerResponseDto {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  isFollowing: boolean;
}

export class FollowingResponseDto {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}
