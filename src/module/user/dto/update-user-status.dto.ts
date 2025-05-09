import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE',
}

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsString()
  blockReason?: string;
}
