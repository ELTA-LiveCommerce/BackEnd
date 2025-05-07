import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Product } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { User } from '@/module/user/entity/user.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItem } from './entity/order-item.entity';
import { Order } from './entity/order.entity';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockProductRepository: any;
  let mockUserRepository: any;
  let mockProductService: any;
  let mockEntityManager: any;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
  };

  const mockProduct = {
    id: 'product-id',
    name: '테스트 상품',
    price: 10000,
    stockQuantity: 10,
    productImage: 'test-image.jpg',
  };

  const mockOrderItem = {
    id: 'order-item-id',
    product: mockProduct,
    quantity: 2,
    price: 10000,
    totalPrice: 20000,
    attributes: '{"color": "red"}',
  };

  const mockOrder = {
    id: 'order-id',
    user: mockUser,
    orderNumber: 'ORD-230101-1234',
    status: OrderStatus.PENDING,
    items: {
      getItems: jest.fn().mockReturnValue([mockOrderItem]),
      add: jest.fn(),
    },
    totalAmount: 20000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockOrderRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getResult: jest.fn(),
      clone: jest.fn().mockReturnThis(),
      count: jest.fn(),
    };

    mockOrderItemRepository = {
      count: jest.fn(),
    };

    mockProductRepository = {
      findOne: jest.fn(),
    };

    mockUserRepository = {
      findOne: jest.fn(),
    };

    mockProductService = {};

    mockEntityManager = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('새 주문을 성공적으로 생성해야 함', async () => {
      // Arrange
      const userId = 'user-id';
      const createOrderDto: CreateOrderDto = {
        items: [
          {
            productId: 'product-id',
            quantity: 2,
            attributes: '{"color": "red"}',
          },
        ],
        shippingAddress: '서울시 강남구',
        notes: '문 앞에 놓아주세요',
        paymentMethod: '카드',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      jest.spyOn(service as any, 'generateOrderNumber').mockReturnValue('ORD-230101-1234');

      // Mock Order constructor
      const mockOrderInstance = {
        ...mockOrder,
        items: {
          add: jest.fn(),
          getItems: jest.fn().mockReturnValue([mockOrderItem]),
        },
      };
      jest.spyOn(global, 'Date').mockImplementation(() => new Date('2023-01-01'));
      (global as any).Order = jest.fn().mockImplementation(() => mockOrderInstance);
      (global as any).OrderItem = jest.fn().mockImplementation(() => mockOrderItem);

      // Act
      const result = await service.create(userId, createOrderDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: 'product-id' });
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('ORD-230101-1234');
      expect(result.status).toBe(OrderStatus.PENDING);
    });

    it('사용자가 존재하지 않으면 NotFoundException을 발생시켜야 함', async () => {
      // Arrange
      const userId = 'non-existent-user-id';
      const createOrderDto: CreateOrderDto = {
        items: [
          {
            productId: 'product-id',
            quantity: 2,
          },
        ],
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(userId, createOrderDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
    });

    it('상품이 존재하지 않으면 NotFoundException을 발생시켜야 함', async () => {
      // Arrange
      const userId = 'user-id';
      const createOrderDto: CreateOrderDto = {
        items: [
          {
            productId: 'non-existent-product-id',
            quantity: 2,
          },
        ],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockProductRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(userId, createOrderDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: 'non-existent-product-id' });
    });

    it('재고가 부족하면 BadRequestException을 발생시켜야 함', async () => {
      // Arrange
      const userId = 'user-id';
      const createOrderDto: CreateOrderDto = {
        items: [
          {
            productId: 'product-id',
            quantity: 20, // 재고보다 많은 수량
          },
        ],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockProductRepository.findOne.mockResolvedValue(mockProduct); // 재고는 10

      // Act & Assert
      await expect(service.create(userId, createOrderDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ id: 'product-id' });
    });
  });

  describe('getOrdersByUser', () => {
    it('사용자의 주문 목록을 반환해야 함', async () => {
      // Arrange
      const userId = 'user-id';
      const getOrdersDto = {
        page: 1,
        limit: 10,
      };

      mockOrderRepository.where.mockReturnThis();
      mockOrderRepository.getResult.mockResolvedValue([mockOrder]);
      mockOrderRepository.count.mockResolvedValue(1);
      mockOrderItemRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.getOrdersByUser(userId, getOrdersDto);

      // Assert
      expect(mockOrderRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockOrderRepository.where).toHaveBeenCalledWith({ user: { id: userId } });
      expect(mockOrderRepository.getResult).toHaveBeenCalled();
      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('상태 필터가 적용된 주문 목록을 반환해야 함', async () => {
      // Arrange
      const userId = 'user-id';
      const getOrdersDto = {
        status: OrderStatus.PENDING,
        page: 1,
        limit: 10,
      };

      mockOrderRepository.where.mockReturnThis();
      mockOrderRepository.andWhere.mockReturnThis();
      mockOrderRepository.getResult.mockResolvedValue([mockOrder]);
      mockOrderRepository.count.mockResolvedValue(1);
      mockOrderItemRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.getOrdersByUser(userId, getOrdersDto);

      // Assert
      expect(mockOrderRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockOrderRepository.where).toHaveBeenCalledWith({ user: { id: userId } });
      expect(mockOrderRepository.andWhere).toHaveBeenCalledWith({ status: OrderStatus.PENDING });
      expect(mockOrderRepository.getResult).toHaveBeenCalled();
      expect(result.items.length).toBe(1);
    });
  });

  describe('getOrderDetail', () => {
    it('주문 상세 정보를 반환해야 함', async () => {
      // Arrange
      const orderId = 'order-id';
      const userId = 'user-id';

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      // Act
      const result = await service.getOrderDetail(orderId, userId);

      // Assert
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith(
        { id: orderId, user: { id: userId } },
        { populate: ['items', 'items.product'] },
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(orderId);
    });

    it('주문이 존재하지 않으면 NotFoundException을 발생시켜야 함', async () => {
      // Arrange
      const orderId = 'non-existent-order-id';
      const userId = 'user-id';

      mockOrderRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getOrderDetail(orderId, userId)).rejects.toThrow(NotFoundException);
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith(
        { id: orderId, user: { id: userId } },
        { populate: ['items', 'items.product'] },
      );
    });
  });

  describe('cancelOrder', () => {
    it('주문을 성공적으로 취소해야 함', async () => {
      // Arrange
      const orderId = 'order-id';
      const userId = 'user-id';
      const reason = '단순 변심';

      const orderToCancel = {
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: {
          getItems: jest.fn().mockReturnValue([
            {
              ...mockOrderItem,
              product: { ...mockProduct },
            },
          ]),
        },
      };

      mockOrderRepository.findOne.mockResolvedValue(orderToCancel);

      // Act
      const result = await service.cancelOrder(orderId, userId, reason);

      // Assert
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith(
        { id: orderId, user: { id: userId } },
        { populate: ['items', 'items.product'] },
      );
      expect(mockEntityManager.flush).toHaveBeenCalled();
      expect(orderToCancel.status).toBe(OrderStatus.CANCELLED);
      expect(orderToCancel.cancelReason).toBe(reason);
      expect(orderToCancel.cancelledAt).toBeDefined();
    });

    it('주문이 이미 배송 중이면 취소할 수 없어야 함', async () => {
      // Arrange
      const orderId = 'order-id';
      const userId = 'user-id';

      const shippedOrder = {
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      };

      mockOrderRepository.findOne.mockResolvedValue(shippedOrder);

      // Act & Assert
      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(BadRequestException);
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith(
        { id: orderId, user: { id: userId } },
        { populate: ['items', 'items.product'] },
      );
    });

    it('주문이 이미 취소되었으면 에러를 반환해야 함', async () => {
      // Arrange
      const orderId = 'order-id';
      const userId = 'user-id';

      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      };

      mockOrderRepository.findOne.mockResolvedValue(cancelledOrder);

      // Act & Assert
      await expect(service.cancelOrder(orderId, userId)).rejects.toThrow(BadRequestException);
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith(
        { id: orderId, user: { id: userId } },
        { populate: ['items', 'items.product'] },
      );
    });
  });
});
