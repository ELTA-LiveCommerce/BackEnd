import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { CartService } from '@/module/cart/cart.service';
import { AddToCartRequestDto, UpdateCartItemRequestDto, RemoveFromCartRequestDto } from './dto/cart-request.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('v2/viewer/cart')
@ApiBearerAuth()
@Controller('v2/viewer/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: '장바구니 조회',
    description: '현재 로그인된 사용자의 장바구니를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '장바구니 조회 성공',
    type: CartResponseDto,
  })
  async getCart(@Req() req: any): Promise<CartResponseDto> {
    const userId = req.user.id;
    const cart = await this.cartService.getCart(userId);
    return CartResponseDto.fromEntity(cart);
  }

  @Post()
  @ApiOperation({
    summary: '장바구니에 상품 추가',
    description: '현재 로그인된 사용자의 장바구니에 상품을 추가합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '상품 추가 성공',
    type: CartResponseDto,
  })
  async addToCart(@Req() req: any, @Body() dto: AddToCartRequestDto): Promise<CartResponseDto> {
    const userId = req.user.id;
    const cart = await this.cartService.addToCart(userId, dto.productId, dto.quantity);
    return CartResponseDto.fromEntity(cart);
  }

  @Put()
  @ApiOperation({
    summary: '장바구니 상품 수량 변경',
    description: '현재 로그인된 사용자의 장바구니에 담긴 상품 수량을 변경합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '상품 수량 변경 성공',
    type: CartResponseDto,
  })
  async updateCartItem(@Req() req: any, @Body() dto: UpdateCartItemRequestDto): Promise<CartResponseDto> {
    const userId = req.user.id;
    const cart = await this.cartService.updateCartItem(userId, dto.productId, dto.quantity);
    return CartResponseDto.fromEntity(cart);
  }

  @Delete('item/:productId')
  @ApiOperation({
    summary: '장바구니에서 상품 삭제',
    description: '현재 로그인된 사용자의 장바구니에서 상품을 삭제합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '상품 삭제 성공',
    type: CartResponseDto,
  })
  async removeFromCart(@Req() req: any, @Param('productId') productId: string): Promise<CartResponseDto> {
    const userId = req.user.id;
    const cart = await this.cartService.removeFromCart(userId, productId);
    return CartResponseDto.fromEntity(cart);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '장바구니 비우기',
    description: '현재 로그인된 사용자의 장바구니를 비웁니다.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '장바구니 비우기 성공',
  })
  async clearCart(@Req() req: any): Promise<void> {
    const userId = req.user.id;
    await this.cartService.clearCart(userId);
  }
}
