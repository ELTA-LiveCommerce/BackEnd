import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class AddToCartRequestDto {
  @ApiProperty({
    description: '추가할 상품의 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: '담을 상품의 수량',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemRequestDto {
  @ApiProperty({
    description: '수정할 상품의 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: '변경할 상품의 수량',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Min(1)
  quantity: number;
}

export class RemoveFromCartRequestDto {
  @ApiProperty({
    description: '삭제할 상품의 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;
}
