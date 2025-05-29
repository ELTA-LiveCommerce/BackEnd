import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 대화방 목록 조회 요청 DTO
 */
export class GetConversationsRequestDto {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '페이지 크기', example: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

/**
 * 답변 전송 요청 DTO
 */
export class ReplyMessageRequestDto {
  @ApiProperty({ description: '답변 내용', example: '네, 재고가 있습니다.' })
  @IsString()
  @IsNotEmpty()
  text: string;
}