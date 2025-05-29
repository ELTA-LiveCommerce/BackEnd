import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityRepository, QueryBuilder } from '@mikro-orm/postgresql';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { wrap, Collection } from '@mikro-orm/core';

// Mock the wrap function
jest.mock('@mikro-orm/core', () => ({
  ...jest.requireActual('@mikro-orm/core'), // Keep other exports intact
  wrap: jest.fn().mockImplementation((entity) => ({
    ...entity, // Spread original properties if needed
    init: jest.fn().mockResolvedValue(undefined), // Add the init mock
  })),
}));

import { DepositService } from './deposit.service';
import { Order } from '@/module/order/entity/order.entity';
import { SellerDepositListRequestDto } from '@/api/v2/seller/deposit/deposit.request.dto';
import { DepositListItemDto } from './dto/deposit-list-item.dto';
import { PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '../product/entity/product.entity';
import { Delivery } from '../delivery/entity/delivery.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { OrderItem } from '../order/entity/order-item.entity';
import { OrderService } from '../order/order.service';

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  joinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getResultList: jest.fn(),
  getCount: jest.fn(),
  count: jest.fn(),
  clone: jest.fn().mockReturnThis(),
};

const mockOrderRepository = {
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockOrderService = {
  _findOrderById: jest.fn(),
  _updateStatus: jest.fn(),
};

const mockClsService = {
  get: jest.fn(),
  set: jest.fn(),
  run: jest.fn((cb) => cb()),
  enter: jest.fn(),
  exit: jest.fn(),
};

// MockCollection 클래스
class MockOrderCollection<T> {
  private items: T[] = [];

  constructor(items: T[] = []) {
    this.items = items;
  }

  getItems(): T[] {
    return this.items;
  }

  isInitialized(): boolean {
    return true;
  }

  // 배열 인덱스 접근을 지원하기 위한 메서드들
  [index: number]: T;

  get length(): number {
    return this.items.length;
  }
}

describe('DepositService', () => {
  let service: DepositService;
  let repository: EntityRepository<Order>;

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear mocks at the top level
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: getRepositoryToken(OrderItem), useValue: {} }, // Basic mock
        { provide: OrderService, useValue: mockOrderService },
      ],
    }).compile();

    service = module.get<DepositService>(DepositService);
    repository = module.get<EntityRepository<Order>>(getRepositoryToken(Order));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findSellerDepositsPaged', () => {
    const sellerId = 'test-seller-id';
    const query: SellerDepositListRequestDto = { page: 1, limit: 10 };
    const mockUserBuyer1 = { id: 'buyer-uuid-1', loginId: 'buyer1', phoneNumber: '010-1111-1111' } as User;
    const mockUserBuyer2 = { id: 'buyer-uuid-2', loginId: 'buyer2', phoneNumber: '010-2222-2222' } as User;
    const mockSeller = { id: sellerId /* add other User props */ } as User;

    const mockProductA = {
      id: 'product-uuid-101', // string id
      name: 'Product A',
      mainImage: 'img_a.jpg',
      seller: mockSeller,
      description: 'Desc A',
      price: 10000,
      stockQuantity: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;

    const mockProductB = {
      id: 'product-uuid-102', // string id
      name: 'Product B',
      mainImage: 'img_b.jpg',
      seller: mockSeller,
      description: 'Desc B',
      price: 12500,
      stockQuantity: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;

    const mockDeliveryA = {
      id: 'delivery-uuid-1', // string id
      address: 'Address A',
      detailAddress: 'Detail A',
      order: null as any, // Cast to any to simplify mock
      seller: mockSeller,
      status: 'PREPARING', // This should be DeliveryStatus type if available, or string
      trackingNumber: 'TRACK-A',
      recipientName: 'Recipient A',
      recipientPhoneNumber: '010-1111-2222',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Delivery;

    const mockDeliveryB = {
      id: 'delivery-uuid-2', // string id
      address: 'Address B',
      detailAddress: 'Detail B',
      order: null as any, // Cast to any to simplify mock
      seller: mockSeller,
      status: 'DELIVERED', // This should be DeliveryStatus type if available, or string
      trackingNumber: 'TRACK-B',
      recipientName: 'Recipient B',
      recipientPhoneNumber: '010-3333-4444',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Delivery;

    const mockOrderItemA = {
      id: 'item-uuid-1',
      product: mockProductA,
      quantity: 1,
      price: 10000,
      order: null as any,
    } as OrderItem;

    const mockOrder = {
      id: 'order-uuid-1',
      user: mockUserBuyer1,
      orderNumber: 'ORD-001',
      status: OrderStatus.PAID,
      items: new Proxy(new MockOrderCollection([mockOrderItemA]), {
        get(target, prop) {
          if (typeof prop === 'string' && !isNaN(Number(prop))) {
            return target.getItems()[Number(prop)];
          }
          return target[prop];
        },
      }),
      totalAmount: 100000,
      shippingAddress: '서울시 강남구',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Order;

    const mockOrders = [mockOrder];
    const total = mockOrders.length;

    it('should return paged deposit list for a seller', async () => {
      mockQueryBuilder.getResultList.mockResolvedValue(mockOrders);
      mockQueryBuilder.count.mockResolvedValue(total);

      const result = await service.findSellerDepositsPaged(sellerId, query);

      const expectedPage = query.page ?? 1;
      const expectedLimit = query.limit ?? 10;
      const expectedOffset = (expectedPage - 1) * expectedLimit;

      expect(result).toBeInstanceOf(PagedResponseV2);
      expect(result.data.page).toBe(expectedPage);
      expect(result.data.limit).toBe(expectedLimit);
      expect(result.data.total).toBe(total);
      expect(result.data.items.length).toBe(1);

      expect(result.data.items[0].orderId).toBe(mockOrder.id);
      expect(result.data.items[0].productName).toBe(mockOrderItemA.product.name);
      expect(result.data.items[0].quantity).toBe(mockOrderItemA.quantity);
      expect(result.data.items[0].buyerLoginId).toBe(mockOrder.user.loginId);
      expect(result.data.items[0].buyerAddress).toBe(mockOrder.shippingAddress);

      const qb = mockOrderRepository.createQueryBuilder();
      expect(qb.leftJoin).toHaveBeenCalledWith('order.user', 'user');
      expect(qb.leftJoin).toHaveBeenCalledWith('order.items', 'oi');
      expect(qb.leftJoin).toHaveBeenCalledWith('oi.product', 'product');
      expect(qb.leftJoin).toHaveBeenCalledWith('product.seller', 'seller');

      expect(qb.where).toHaveBeenCalledWith({ status: { $in: expect.any(Array) } });
      expect(qb.andWhere).toHaveBeenCalledWith({ 'seller.id': sellerId });

      expect(qb.orderBy).toHaveBeenCalledWith({ createdAt: 'DESC' });
      expect(qb.offset).toHaveBeenCalledWith(expectedOffset);
      expect(qb.limit).toHaveBeenCalledWith(expectedLimit);
      expect(qb.getResultList).toHaveBeenCalled();
      expect(qb.count).toHaveBeenCalled();
    });

    it('should return empty list when no orders found', async () => {
      mockQueryBuilder.getResultList.mockResolvedValue([]);
      mockQueryBuilder.count.mockResolvedValue(0);

      const result = await service.findSellerDepositsPaged(sellerId, query);

      expect(result.data.total).toBe(0);
      expect(result.data.items?.length).toBe(0);
    });

    it('should return paged deposit list for a seller with default values', async () => {
      mockQueryBuilder.getResultList.mockResolvedValue(mockOrders);
      mockQueryBuilder.count.mockResolvedValue(total);

      const result = await service.findSellerDepositsPaged(sellerId, query);

      const expectedPage = query.page ?? 1;
      const expectedLimit = query.limit ?? 10;
      const expectedOffset = (expectedPage - 1) * expectedLimit;

      expect(result).toBeInstanceOf(PagedResponseV2);
      expect(result.data.page).toBe(expectedPage);
      expect(result.data.limit).toBe(expectedLimit);
      expect(result.data.total).toBe(total);
      expect(result.data.items.length).toBe(total);

      expect(result.data.items[0].orderId).toBe(mockOrders[0].id);
      expect(result.data.items[0].productName).toBe(mockOrders[0].items[0].product.name);
      expect(result.data.items[0].quantity).toBe(mockOrders[0].items[0].quantity);
      expect(result.data.items[0].buyerLoginId).toBe(mockOrders[0].user.loginId);
      expect(result.data.items[0].buyerAddress).toBe(mockOrders[0].shippingAddress);

      const qb = mockOrderRepository.createQueryBuilder();
      expect(qb.leftJoin).toHaveBeenCalledWith('order.user', 'user');
      expect(qb.leftJoin).toHaveBeenCalledWith('order.items', 'oi');
      expect(qb.leftJoin).toHaveBeenCalledWith('oi.product', 'product');
      expect(qb.leftJoin).toHaveBeenCalledWith('product.seller', 'seller');

      expect(qb.where).toHaveBeenCalledWith({ status: { $in: expect.any(Array) } });
      expect(qb.andWhere).toHaveBeenCalledWith({ 'seller.id': sellerId });

      expect(qb.orderBy).toHaveBeenCalledWith({ createdAt: 'DESC' });
      expect(qb.offset).toHaveBeenCalledWith(expectedOffset);
      expect(qb.limit).toHaveBeenCalledWith(expectedLimit);
      expect(qb.getResultList).toHaveBeenCalled();
      expect(qb.count).toHaveBeenCalled();
    });
  });

  describe('confirmDeposits', () => {
    const sellerId = 'test-seller-id';
    const orderId1 = 'order-uuid-1';
    const orderId2 = 'order-uuid-2';
    const orderIds = [orderId1, orderId2];

    // Helper to create mocks with init functions
    const createMockOrderItems = (targetSellerId: string) => [
      {
        product: {
          seller: {
            id: targetSellerId,
          },
        },
      },
    ];

    const mockOrder1 = {
      id: orderId1,
      status: OrderStatus.PAID,
      items: createMockOrderItems(sellerId),
    } as unknown as Order;

    const mockOrder2 = {
      id: orderId2,
      status: OrderStatus.PAID,
      items: createMockOrderItems(sellerId),
    } as unknown as Order;

    // No separate beforeEach needed here as mocks are cleared in the top-level beforeEach

    it('should successfully confirm deposits for valid orders', async () => {
      mockOrderService._findOrderById.mockResolvedValueOnce(mockOrder1).mockResolvedValueOnce(mockOrder2);
      mockOrderService._updateStatus.mockResolvedValue(undefined);

      await service.confirmDeposits(sellerId, orderIds);

      expect(mockOrderService._findOrderById).toHaveBeenCalledTimes(2);
      expect(mockOrderService._updateStatus).toHaveBeenCalledTimes(2);
      expect(mockOrderService._updateStatus).toHaveBeenCalledWith(mockOrder1, OrderStatus.PROCESSING);
      expect(mockOrderService._updateStatus).toHaveBeenCalledWith(mockOrder2, OrderStatus.PROCESSING);
    });

    it('should throw BadRequestException if an order is not found', async () => {
      mockOrderService._findOrderById.mockResolvedValueOnce(mockOrder1).mockResolvedValueOnce(null);
      mockOrderService._updateStatus.mockResolvedValue(undefined);

      // Call only once and assert exception type and message
      await expect(service.confirmDeposits(sellerId, orderIds)).rejects.toThrow(
        new BadRequestException(
          `다음 주문들의 입금 확인 처리에 실패했습니다: ${orderId2}. 세부 정보: ${JSON.stringify([{ orderId: orderId2, message: `주문 ID ${orderId2}를 찾을 수 없습니다.` }])}`,
        ),
      );
      // Verify update was called only for the valid order before the loop was likely exited internally by the throw
      expect(mockOrderService._updateStatus).toHaveBeenCalledTimes(1);
      expect(mockOrderService._updateStatus).toHaveBeenCalledWith(mockOrder1, OrderStatus.PROCESSING);
    });

    it('should throw BadRequestException if an order does not belong to the seller', async () => {
      const mockOrderWrongSeller = {
        id: orderId2,
        status: OrderStatus.PAID,
        items: createMockOrderItems('other-seller-id'),
      } as unknown as Order;
      mockOrderService._findOrderById.mockResolvedValueOnce(mockOrder1).mockResolvedValueOnce(mockOrderWrongSeller);
      mockOrderService._updateStatus.mockResolvedValue(undefined);

      // Call only once and assert exception type and message
      await expect(service.confirmDeposits(sellerId, orderIds)).rejects.toThrow(
        new BadRequestException(
          `다음 주문들의 입금 확인 처리에 실패했습니다: ${orderId2}. 세부 정보: ${JSON.stringify([{ orderId: orderId2, message: `주문 ID ${orderId2}에 대한 권한이 없습니다.` }])}`,
        ),
      );
      expect(mockOrderService._updateStatus).toHaveBeenCalledTimes(1);
      expect(mockOrderService._updateStatus).toHaveBeenCalledWith(mockOrder1, OrderStatus.PROCESSING);
    });

    it('should throw BadRequestException if an order is not in PAID state', async () => {
      const mockOrderShipped = {
        id: orderId2,
        status: OrderStatus.SHIPPED,
        items: createMockOrderItems(sellerId),
      } as unknown as Order;
      mockOrderService._findOrderById.mockResolvedValueOnce(mockOrder1).mockResolvedValueOnce(mockOrderShipped);
      mockOrderService._updateStatus.mockResolvedValue(undefined);

      // Call only once and assert exception type and message
      await expect(service.confirmDeposits(sellerId, orderIds)).rejects.toThrow(
        new BadRequestException(
          `다음 주문들의 입금 확인 처리에 실패했습니다: ${orderId2}. 세부 정보: ${JSON.stringify([{ orderId: orderId2, message: `주문 ID ${orderId2}는 'PAID' 상태가 아니므로 입금 확인할 수 없습니다. 현재 상태: ${OrderStatus.SHIPPED}` }])}`,
        ),
      );
      expect(mockOrderService._updateStatus).toHaveBeenCalledTimes(1);
      expect(mockOrderService._updateStatus).toHaveBeenCalledWith(mockOrder1, OrderStatus.PROCESSING);
    });

    it('should handle partial failure correctly (combined errors)', async () => {
      const mockOrderNotFound = null; // For orderId1
      const mockOrderWrongState = {
        id: orderId2,
        status: OrderStatus.CANCELLED,
        items: createMockOrderItems(sellerId),
      } as unknown as Order; // For orderId2

      mockOrderService._findOrderById
        .mockResolvedValueOnce(mockOrderNotFound) // orderId1 not found
        .mockResolvedValueOnce(mockOrderWrongState); // orderId2 wrong state
      mockOrderService._updateStatus.mockResolvedValue(undefined);

      expect.assertions(5); // error instance, response type, message type, message content, not called

      try {
        await service.confirmDeposits(sellerId, orderIds);
        // This line should not be reached if the exception is thrown as expected.
        // If it is, the test should fail. We use expect.assertions for this.
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);

        const response = error.getResponse();
        // Expect the standard NestJS error response object
        expect(typeof response).toBe('object');

        // The actual detailed message is in the 'message' property of the response object
        const errorMessage = response.message;
        expect(typeof errorMessage).toBe('string'); // Ensure the message property itself is a string

        const expectedErrorDetails = [
          { orderId: orderId1, message: `주문 ID ${orderId1}를 찾을 수 없습니다.` },
          {
            orderId: orderId2,
            message: `주문 ID ${orderId2}는 'PAID' 상태가 아니므로 입금 확인할 수 없습니다. 현재 상태: ${OrderStatus.CANCELLED}`,
          },
        ];
        // Use join(', ') to match the service implementation
        const expectedMainMessage = `다음 주문들의 입금 확인 처리에 실패했습니다: ${orderIds.join(', ')}. 세부 정보: ${JSON.stringify(expectedErrorDetails)}`;

        expect(errorMessage).toBe(expectedMainMessage);
      }
      expect(mockOrderService._updateStatus).not.toHaveBeenCalled(); // This is the 5th assertion
    });
  });
});

