import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDate, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class BroadcastProductDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsString()
  broadcastDescription?: string;

  @IsOptional()
  specialPrice?: number;
}

export class CreateBroadcastDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  scheduledDate!: Date;

  @IsOptional()
  @IsString()
  thumbnailImage?: string;

  // streamKey는 서비스에서 생성하거나 외부 시스템에서 받아올 수 있으므로 DTO에선 제외할 수 있습니다.
  // 만약 클라이언트가 제공해야 한다면 추가합니다.
  // @IsNotEmpty()
  // @IsString()
  // streamKey!: string;

  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BroadcastProductDto)
  products?: BroadcastProductDto[];

  // TODO: sellerId 등 필요한 추가 정보
  // @IsNotEmpty()
  // @IsString()
  // sellerId!: string;
}
