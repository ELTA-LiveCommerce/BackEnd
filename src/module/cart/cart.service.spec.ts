import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';

import { CartService } from './cart.service';
import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let cartRepositoryMock: any;
  let cartItemRepositoryMock: any;
  let productRepositoryMock: any;
  let entityManagerMock: any;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
  };

  const mockProduct = {
    id: 'product-id-1',
    name: '테스트 상품',
    price: 10000,
    stockQuantity: 10,
  };

  const mockCartItem = {
    id: 'cart-item-id-1',
    cart: { id: 'cart-id-1' },
    product: mockProduct,
    quantity: 2,
  };

  const mockCart = {
    id: 'cart-id-1',
    user: mockUser,
    items: [], // 실제 배열로 변경
  };

  beforeEach(async () => {
    cartRepositoryMock = {
      findOne: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    cartItemRepositoryMock = {
      findOne: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    productRepositoryMock = {
      findOne: jest.fn(),
    };

    entityManagerMock = {
      getReference: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: cartRepositoryMock,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: cartItemRepositoryMock,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('사용자의 장바구니가 존재하는 경우 장바구니를 반환해야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);

      // When
      const result = await service.getCart(mockUser.id);

      // Then
      expect(result).toEqual(mockCart);
      expect(cartRepositoryMock.findOne).toHaveBeenCalledWith({ user: { id: mockUser.id } }, expect.any(Object));
    });

    it('사용자의 장바구니가 존재하지 않는 경우 새 장바구니를 생성해야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValueOnce(null); // 첫 번째 호출에서는 null 반환
      entityManagerMock.getReference.mockReturnValue(mockUser);
      cartRepositoryMock.findOne.mockResolvedValueOnce(mockCart); // 두 번째 호출에서는 mockCart 반환

      // When
      const result = await service.getCart(mockUser.id);

      // Then
      expect(entityManagerMock.persistAndFlush).toHaveBeenCalled();
      expect(result).toEqual(mockCart);
    });

    it('새 장바구니 생성 후에도 찾을 수 없으면 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(null);
      entityManagerMock.getReference.mockReturnValue(mockUser);

      // When & Then
      await expect(service.getCart(mockUser.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addToCart', () => {
    it('새 상품을 장바구니에 추가해야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      cartItemRepositoryMock.findOne.mockResolvedValue(null); // 상품이 장바구니에 없음

      // When
      await service.addToCart(mockUser.id, mockProduct.id, 2);

      // Then
      expect(mockCart.items.length).toBeGreaterThan(0); // 배열에 아이템이 추가되었는지 확인
      expect(entityManagerMock.flush).toHaveBeenCalled();
    });

    it('장바구니에 이미 있는 상품의 수량을 증가시켜야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      const existingCartItem = { ...mockCartItem, quantity: 1 };
      cartItemRepositoryMock.findOne.mockResolvedValue(existingCartItem);

      // When
      await service.addToCart(mockUser.id, mockProduct.id, 2);

      // Then
      expect(existingCartItem.quantity).toBe(3); // 1 + 2 = 3
      expect(entityManagerMock.flush).toHaveBeenCalled();
    });

    it('상품이 존재하지 않으면 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.addToCart(mockUser.id, 'non-existent-product', 1)).rejects.toThrow(NotFoundException);
    });

    it('상품 재고가 부족하면 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      const lowStockProduct = { ...mockProduct, stockQuantity: 2 };
      productRepositoryMock.findOne.mockResolvedValue(lowStockProduct);

      // When & Then
      await expect(service.addToCart(mockUser.id, mockProduct.id, 3)).rejects.toThrow('상품의 재고가 부족합니다');
    });

    it('이미 장바구니에 있는 상품의 수량을 증가시킬 때 재고 초과시 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      const existingCartItem = { ...mockCartItem, quantity: 8 }; // 이미 8개 담김
      cartItemRepositoryMock.findOne.mockResolvedValue(existingCartItem);

      // When & Then
      await expect(service.addToCart(mockUser.id, mockProduct.id, 3)).rejects.toThrow('상품의 재고가 부족합니다');
    });
  });

  describe('updateCartItem', () => {
    it('장바구니 상품의 수량을 변경해야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      const cartItem = { ...mockCartItem, quantity: 1 };
      cartItemRepositoryMock.findOne.mockResolvedValue(cartItem);

      // When
      await service.updateCartItem(mockUser.id, mockProduct.id, 4);

      // Then
      expect(cartItem.quantity).toBe(4);
      expect(entityManagerMock.flush).toHaveBeenCalled();
    });

    it('상품이 존재하지 않으면 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.updateCartItem(mockUser.id, 'non-existent-product', 1)).rejects.toThrow(NotFoundException);
    });

    it('장바구니에 상품이 없으면 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      cartItemRepositoryMock.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.updateCartItem(mockUser.id, mockProduct.id, 1)).rejects.toThrow(NotFoundException);
    });

    it('변경하려는 수량이 재고보다 많으면 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      cartItemRepositoryMock.findOne.mockResolvedValue(mockCartItem);

      // When & Then
      await expect(service.updateCartItem(mockUser.id, mockProduct.id, 15)).rejects.toThrow('상품의 재고가 부족합니다');
    });
  });

  describe('removeFromCart', () => {
    it('장바구니에서 상품을 삭제해야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      cartItemRepositoryMock.findOne.mockResolvedValue(mockCartItem);

      // When
      await service.removeFromCart(mockUser.id, mockProduct.id);

      // Then
      expect(entityManagerMock.removeAndFlush).toHaveBeenCalledWith(mockCartItem);
    });

    it('장바구니에 상품이 없으면 예외를 던져야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);
      cartItemRepositoryMock.findOne.mockResolvedValue(null);

      // When & Then
      await expect(service.removeFromCart(mockUser.id, mockProduct.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('장바구니의 모든 상품을 삭제해야 함', async () => {
      // Given
      cartRepositoryMock.findOne.mockResolvedValue(mockCart);

      // When
      await service.clearCart(mockUser.id);

      // Then
      expect(mockCart.items.length).toBe(0); // 배열이 비워졌는지 확인
      expect(entityManagerMock.flush).toHaveBeenCalled();
    });
  });
});

