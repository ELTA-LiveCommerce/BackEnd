import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, Loaded } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: EntityRepository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: EntityRepository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 사용자의 장바구니를 조회합니다.
   */
  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({ user: { id: userId } }, { populate: ['items', 'items.product'] });

    if (!cart) {
      const user = await this.em.getReference(User, userId);
      const newCart = new Cart();
      newCart.user = user;
      await this.em.persistAndFlush(newCart);
      // 새로 생성 후 다시 불러오기
      cart = await this.cartRepository.findOne({ user: { id: userId } });

      if (!cart) {
        throw new NotFoundException(`장바구니를 찾을 수 없습니다.`);
      }
    }

    return cart;
  }

  /**
   * 장바구니에 상품을 추가합니다.
   */
  async addToCart(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const product = await this.productRepository.findOne({ id: productId });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 상품 재고 확인
    if (product.stockQuantity < quantity) {
      throw new Error(`상품의 재고가 부족합니다. 현재 재고: ${product.stockQuantity}`);
    }

    // 장바구니에 이미 있는 상품인지 확인
    let cartItem = await this.cartItemRepository.findOne({
      cart: { id: cart.id },
      product: { id: productId },
    });

    if (cartItem) {
      // 이미 존재하는 상품이면 수량 확인 후 증가
      if (product.stockQuantity < cartItem.quantity + quantity) {
        throw new Error(`상품의 재고가 부족합니다. 현재 재고: ${product.stockQuantity}`);
      }
      cartItem.quantity += quantity;
    } else {
      // 새 상품이면 새 CartItem 생성
      cartItem = new CartItem();
      cartItem.cart = cart;
      cartItem.product = product;
      cartItem.quantity = quantity;
      this.em.persist(cartItem);
    }

    await this.em.flush();

    // 최신 장바구니 정보 조회
    return this.getCart(userId);
  }

  /**
   * 장바구니 상품 수량을 변경합니다.
   */
  async updateCartItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const product = await this.productRepository.findOne({ id: productId });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 상품 재고 확인
    if (product.stockQuantity < quantity) {
      throw new Error(`상품의 재고가 부족합니다. 현재 재고: ${product.stockQuantity}`);
    }

    const cartItem = await this.cartItemRepository.findOne({
      cart: { id: cart.id },
      product: { id: productId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Product with ID ${productId} not found in cart`);
    }

    cartItem.quantity = quantity;
    await this.em.flush();

    return this.getCart(userId);
  }

  /**
   * 장바구니에서 상품을 삭제합니다.
   */
  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      cart: { id: cart.id },
      product: { id: productId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Product with ID ${productId} not found in cart`);
    }

    await this.em.removeAndFlush(cartItem);

    return this.getCart(userId);
  }

  /**
   * 장바구니를 비웁니다.
   */
  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    // 장바구니의 모든 아이템 삭제
    const cartItems = await this.cartItemRepository.find({ cart: { id: cart.id } });
    cartItems.forEach((item) => this.em.remove(item));
    await this.em.flush();

    return cart;
  }
}

