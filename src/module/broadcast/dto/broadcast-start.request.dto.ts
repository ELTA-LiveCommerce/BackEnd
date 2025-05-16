import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

/**
 * 방송 시작 요청 DTO
 */
export class BroadcastStartRequestDto {
  @ApiProperty({
    description: '방송 ID',
    example: '12345678-1234-1234-1234-123456789012',
  })
  @IsUUID()
  @IsString()
  broadcastId: string;
}
