import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 메시지 전송 요청 DTO
 */
export class SendMessageRequestDto {
  @ApiProperty({ description: '메시지 내용', example: '안녕하세요, 상품 문의드립니다.' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * 메시지 목록 조회 요청 DTO
 */
export class GetMessagesRequestDto {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '페이지 크기', example: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}