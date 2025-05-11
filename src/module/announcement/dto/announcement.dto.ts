import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsDate,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { AnnouncementTargetPlatform } from '../entity/announcement.entity';

export class CreateAnnouncementDto {
  @ApiProperty({ description: '공지사항 제목', example: '새로운 기능 업데이트 안내' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: '공지사항 내용 (HTML 가능)', example: '<p>새로운 기능이 추가되었습니다!</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '공지사항 이미지 URL', example: 'https://example.com/image.png' })
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2048)
  imageUrl!: string;

  @ApiProperty({ description: '게시 시작일', example: '2024-01-01T00:00:00.000Z', type: Date })
  @IsNotEmpty()
  @Type(() => Date) // 요청에서 문자열로 올 경우 Date 타입으로 변환
  @IsDate()
  startDate!: Date;

  @ApiProperty({ description: '게시 종료일', example: '2024-01-31T23:59:59.000Z', type: Date })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @ApiPropertyOptional({ description: '활성 여부', default: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: '표시 순서 (낮을수록 먼저)', default: 0, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    description: '대상 플랫폼',
    enum: AnnouncementTargetPlatform,
    default: AnnouncementTargetPlatform.ALL,
  })
  @IsOptional()
  @IsEnum(AnnouncementTargetPlatform)
  targetPlatform?: AnnouncementTargetPlatform = AnnouncementTargetPlatform.ALL;

  @ApiPropertyOptional({ description: '클릭 시 이동할 URL', example: 'https://example.com/details' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  linkUrl?: string;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

export class AnnouncementResponseDto {
  @ApiProperty({ description: '공지사항 ID' })
  id!: string;

  @ApiProperty({ description: '공지사항 제목' })
  title!: string;

  @ApiPropertyOptional({ description: '공지사항 내용 (HTML 가능)' })
  content?: string;

  @ApiProperty({ description: '공지사항 이미지 URL' })
  imageUrl!: string;

  @ApiProperty({ description: '게시 시작일', type: String, format: 'date-time' })
  startDate!: Date;

  @ApiProperty({ description: '게시 종료일', type: String, format: 'date-time' })
  endDate!: Date;

  @ApiProperty({ description: '활성 여부' })
  isActive!: boolean;

  @ApiProperty({ description: '표시 순서' })
  displayOrder!: number;

  @ApiProperty({ description: '대상 플랫폼', enum: AnnouncementTargetPlatform })
  targetPlatform!: AnnouncementTargetPlatform;

  @ApiPropertyOptional({ description: '클릭 시 이동할 URL' })
  linkUrl?: string;

  @ApiProperty({ description: '생성일', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: '수정일', type: String, format: 'date-time' })
  updatedAt!: Date;

  // 엔티티로부터 DTO를 생성하는 static 메서드 (선택적이지만 편리함)
  static fromEntity(entity: any): AnnouncementResponseDto {
    // entity 타입을 Announcement로 명시하는 것이 좋음
    const dto = new AnnouncementResponseDto();
    dto.id = entity.id;
    dto.title = entity.title;
    dto.content = entity.content;
    dto.imageUrl = entity.imageUrl;
    dto.startDate = entity.startDate;
    dto.endDate = entity.endDate;
    dto.isActive = entity.isActive;
    dto.displayOrder = entity.displayOrder;
    dto.targetPlatform = entity.targetPlatform;
    dto.linkUrl = entity.linkUrl;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

export class GetAnnouncementsQueryDto {
  @ApiPropertyOptional({ description: '대상 플랫폼 필터', enum: AnnouncementTargetPlatform })
  @IsOptional()
  @IsEnum(AnnouncementTargetPlatform)
  platform?: AnnouncementTargetPlatform;

  @ApiPropertyOptional({ description: '활성화된 공지만 조회 여부', type: Boolean, default: true })
  @IsOptional()
  @Type(() => Boolean) // 쿼리 파라미터는 문자열로 오므로 Boolean 변환
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1, type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 10, type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
