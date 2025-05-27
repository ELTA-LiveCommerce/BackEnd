import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
/**
 * 현재 공지 dto
 */
export class BroadcastAnnouncementDto {
  @ApiProperty({ description: '공지내용', example: '공지내용입니다' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class BroadcastAnnouncementResponseDto {
  @ApiProperty({ description: '공지내용', example: '공지내용입니다' })
  content: string;

  static fromEntity(announcement: { content: string }): BroadcastAnnouncementResponseDto {
    const dto = new BroadcastAnnouncementResponseDto();
    dto.content = announcement.content;
    return dto;
  }
}
