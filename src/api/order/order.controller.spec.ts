import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OrderService } from '@/module/order/order.service';
import { OrderStatus } from '@/shared/enum/order-status.enum';

import { OrderController } from './order.controller';

describe('OrderController', () => {
  let controller: OrderController;
  let mockOrderService: any;

  const mockUser = { id: 'user-id', email: 'test@example.com' };

  const mockOrderResponse = {
    id: 'order-id',
    orderNumber: 'ORD-230101-1234',
    userId: 'user-id',
    status: OrderStatus.PENDING,
    items: [
      {
        id: 'order-item-id',
        productId: 'product-id',
        productName: '테스트 상품',
        quantity: 2,
        price: 10000,
        totalPrice: 20000,
      },
    ],
    totalAmount: 20000,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockPaginatedOrdersResponse = {
    items: [
      {
        id: 'order-id',
        orderNumber: 'ORD-230101-1234',
        status: OrderStatus.PENDING,
        totalAmount: 20000,
        itemCount: 1,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    mockOrderService = {
      create: jest.fn(),
      getOrdersByUser: jest.fn(),
      getOrderDetail: jest.fn(),
      cancelOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('주문을 성공적으로 생성해야 함', async () => {
      // Arrange
      const createOrderDto = {
        items: [
          {
            productId: 'product-id',
            quantity: 2,
          },
        ],
        shippingAddress: '서울시 강남구',
      };
      mockOrderService.create.mockResolvedValue(mockOrderResponse);

      // Act
      const result = await controller.createOrder(mockUser, createOrderDto);

      // Assert
      expect(mockOrderService.create).toHaveBeenCalledWith(mockUser.id, createOrderDto);
      expect(result).toBe(mockOrderResponse);
    });
  });

  describe('getMyOrders', () => {
    it('내 주문 목록을 반환해야 함', async () => {
      // Arrange
      const getOrdersDto = {
        page: 1,
        limit: 10,
      };
      mockOrderService.getOrdersByUser.mockResolvedValue(mockPaginatedOrdersResponse);

      // Act
      const result = await controller.getMyOrders(mockUser, getOrdersDto);

      // Assert
      expect(mockOrderService.getOrdersByUser).toHaveBeenCalledWith(mockUser.id, getOrdersDto);
      expect(result).toBe(mockPaginatedOrdersResponse);
    });
  });

  describe('getOrderDetail', () => {
    it('주문 상세 정보를 반환해야 함', async () => {
      // Arrange
      const orderId = 'order-id';
      mockOrderService.getOrderDetail.mockResolvedValue(mockOrderResponse);

      // Act
      const result = await controller.getOrderDetail(mockUser, orderId);

      // Assert
      expect(mockOrderService.getOrderDetail).toHaveBeenCalledWith(orderId, mockUser.id);
      expect(result).toBe(mockOrderResponse);
    });

    it('주문이 존재하지 않으면 NotFoundException을 발생시켜야 함', async () => {
      // Arrange
      const orderId = 'non-existent-order-id';
      mockOrderService.getOrderDetail.mockRejectedValue(new NotFoundException('주문을 찾을 수 없습니다.'));

      // Act & Assert
      await expect(controller.getOrderDetail(mockUser, orderId)).rejects.toThrow(NotFoundException);
      expect(mockOrderService.getOrderDetail).toHaveBeenCalledWith(orderId, mockUser.id);
    });
  });

  describe('cancelOrder', () => {
    it('주문을 성공적으로 취소해야 함', async () => {
      // Arrange
      const orderId = 'order-id';
      const cancelDto = { reason: '단순 변심' };
      const cancelledOrderResponse = {
        ...mockOrderResponse,
        status: OrderStatus.CANCELLED,
        cancelReason: '단순 변심',
        cancelledAt: new Date(),
      };
      mockOrderService.cancelOrder.mockResolvedValue(cancelledOrderResponse);

      // Act
      const result = await controller.cancelOrder(mockUser, orderId, cancelDto);

      // Assert
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(orderId, mockUser.id, cancelDto.reason);
      expect(result).toBe(cancelledOrderResponse);
    });

    it('이미 배송 중인 주문은 취소할 수 없어야 함', async () => {
      // Arrange
      const orderId = 'shipped-order-id';
      const cancelDto = { reason: '단순 변심' };
      mockOrderService.cancelOrder.mockRejectedValue(
        new BadRequestException('이미 배송 중이거나 배송 완료된 주문은 취소할 수 없습니다.'),
      );

      // Act & Assert
      await expect(controller.cancelOrder(mockUser, orderId, cancelDto)).rejects.toThrow(BadRequestException);
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(orderId, mockUser.id, cancelDto.reason);
    });
  });
});
