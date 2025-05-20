import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { BlockType } from '@/module/user/entity/seller-user-block.entity';

/**
 * 사용자 차단 요청 DTO
 */
export class SellerBlockUserRequestDto {
  @IsNotEmpty()
  @IsUUID()
  userIdToBlock!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(BlockType)
  blockType?: BlockType = BlockType.BLOCKED;
}
