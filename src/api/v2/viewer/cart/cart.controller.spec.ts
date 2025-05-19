import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from '@/module/cart/cart.service';
import { AddToCartRequestDto, UpdateCartItemRequestDto } from './dto/cart-request.dto';
import { CartResponseDto } from './dto/cart-response.dto';

describe('CartController', () => {
  let controller: CartController;
  let cartServiceMock: any;
  let cacheManagerMock: any;

  const mockUser = { id: 'user-id-1', email: 'test@example.com' };

  const mockRequest = { user: mockUser };

  const mockCart = {
    id: 'cart-id-1',
    user: mockUser,
    items: [
      {
        id: 'cart-item-id-1',
        product: {
          id: 'product-id-1',
          name: '테스트 상품',
          price: 10000,
          mainImage: 'image.jpg',
        },
        quantity: 2,
      },
    ],
  };

  const mockCartResponse = {
    id: 'cart-id-1',
    items: [
      {
        id: 'cart-item-id-1',
        productId: 'product-id-1',
        productName: '테스트 상품',
        productImageUrl: 'image.jpg',
        price: 10000,
        quantity: 2,
        totalPrice: 20000,
      },
    ],
    totalItems: 2,
    totalPrice: 20000,
  };

  beforeEach(async () => {
    cartServiceMock = {
      getCart: jest.fn(),
      addToCart: jest.fn(),
      updateCartItem: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
    };

    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: cartServiceMock,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);

    // CartResponseDto.fromEntity 모킹
    jest.spyOn(CartResponseDto, 'fromEntity').mockReturnValue(mockCartResponse as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCart', () => {
    it('사용자의 장바구니를 조회해야 함', async () => {
      // Given
      cartServiceMock.getCart.mockResolvedValue(mockCart);

      // When
      const result = await controller.getCart(mockRequest);

      // Then
      expect(result).toEqual(mockCartResponse);
      expect(cartServiceMock.getCart).toHaveBeenCalledWith(mockUser.id);
      expect(CartResponseDto.fromEntity).toHaveBeenCalledWith(mockCart);
    });
  });

  describe('addToCart', () => {
    it('장바구니에 상품을 추가해야 함', async () => {
      // Given
      const dto: AddToCartRequestDto = {
        productId: 'product-id-1',
        quantity: 2,
      };
      cartServiceMock.addToCart.mockResolvedValue(mockCart);

      // When
      const result = await controller.addToCart(mockRequest, dto);

      // Then
      expect(result).toEqual(mockCartResponse);
      expect(cartServiceMock.addToCart).toHaveBeenCalledWith(mockUser.id, dto.productId, dto.quantity);
      expect(CartResponseDto.fromEntity).toHaveBeenCalledWith(mockCart);
    });
  });

  describe('updateCartItem', () => {
    it('장바구니 상품 수량을 변경해야 함', async () => {
      // Given
      const dto: UpdateCartItemRequestDto = {
        productId: 'product-id-1',
        quantity: 4,
      };
      cartServiceMock.updateCartItem.mockResolvedValue(mockCart);

      // When
      const result = await controller.updateCartItem(mockRequest, dto);

      // Then
      expect(result).toEqual(mockCartResponse);
      expect(cartServiceMock.updateCartItem).toHaveBeenCalledWith(mockUser.id, dto.productId, dto.quantity);
      expect(CartResponseDto.fromEntity).toHaveBeenCalledWith(mockCart);
    });
  });

  describe('removeFromCart', () => {
    it('장바구니에서 상품을 삭제해야 함', async () => {
      // Given
      const productId = 'product-id-1';
      cartServiceMock.removeFromCart.mockResolvedValue(mockCart);

      // When
      const result = await controller.removeFromCart(mockRequest, productId);

      // Then
      expect(result).toEqual(mockCartResponse);
      expect(cartServiceMock.removeFromCart).toHaveBeenCalledWith(mockUser.id, productId);
      expect(CartResponseDto.fromEntity).toHaveBeenCalledWith(mockCart);
    });
  });

  describe('clearCart', () => {
    it('장바구니를 비워야 함', async () => {
      // Given
      cartServiceMock.clearCart.mockResolvedValue(undefined);

      // When
      await controller.clearCart(mockRequest);

      // Then
      expect(cartServiceMock.clearCart).toHaveBeenCalledWith(mockUser.id);
    });
  });
});

