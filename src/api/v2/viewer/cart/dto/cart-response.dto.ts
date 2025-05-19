import { ApiProperty } from '@nestjs/swagger';
import { Cart } from '@/module/cart/entity/cart.entity';
import { CartItem } from '@/module/cart/entity/cart-item.entity';

export class CartItemResponseDto {
  @ApiProperty({
    description: '장바구니 아이템 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '상품 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  productId: string;

  @ApiProperty({
    description: '상품명',
    example: '멋진 상품',
  })
  productName: string;

  @ApiProperty({
    description: '상품 이미지 URL',
    example: 'https://example.com/image.jpg',
  })
  productImageUrl: string;

  @ApiProperty({
    description: '상품 가격',
    example: 10000,
  })
  price: number;

  @ApiProperty({
    description: '상품 수량',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: '상품 총 가격 (가격 * 수량)',
    example: 20000,
  })
  totalPrice: number;

  static fromEntity(cartItem: CartItem): CartItemResponseDto {
    const dto = new CartItemResponseDto();
    dto.id = cartItem.id;
    dto.productId = cartItem.product.id;
    dto.productName = cartItem.product.name;
    dto.productImageUrl =
      cartItem.product.mainImage ||
      (cartItem.product.images && cartItem.product.images.length > 0 ? cartItem.product.images[0] : '');
    dto.price = cartItem.product.price;
    dto.quantity = cartItem.quantity;
    dto.totalPrice = cartItem.product.price * cartItem.quantity;
    return dto;
  }
}

export class CartResponseDto {
  @ApiProperty({
    description: '장바구니 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '장바구니 아이템 목록',
    type: [CartItemResponseDto],
  })
  items: CartItemResponseDto[];

  @ApiProperty({
    description: '장바구니 상품 총 개수',
    example: 3,
  })
  totalItems: number;

  @ApiProperty({
    description: '장바구니 상품 총 가격',
    example: 50000,
  })
  totalPrice: number;

  static fromEntity(cart: Cart): CartResponseDto {
    const dto = new CartResponseDto();
    dto.id = cart.id;
    dto.items = Array.from(cart.items).map((item) => CartItemResponseDto.fromEntity(item));
    dto.totalItems = dto.items.reduce((sum, item) => sum + item.quantity, 0);
    dto.totalPrice = dto.items.reduce((sum, item) => sum + item.totalPrice, 0);
    return dto;
  }
}

