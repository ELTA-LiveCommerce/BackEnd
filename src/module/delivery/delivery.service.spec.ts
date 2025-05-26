import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { NotFoundException } from '@nestjs/common';

import { DeliveryService } from './delivery.service';
import { Delivery, DeliveryStatus } from './entity/delivery.entity';
import { Order } from '../order/entity/order.entity';
import { OrderItem } from '../order/entity/order-item.entity';
import { User } from '../user/entity/user.entity';
import { Product } from '../product/entity/product.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let mockDeliveryRepository: any;
  let mockOrderRepository: any;
  let mockOrderItemRepository: any;
  let mockEntityManager: any;

  // Mock data
  const mockUser = {
    id: 'user-id',
    name: '테스트 구매자',
    role: UserRole.VIEWER,
  } as User;

  const mockSeller = {
    id: 'seller-id',
    name: '테스트 판매자',
    role: UserRole.SELLER,
  } as User;

  const mockProduct = {
    id: 'product-id',
    name: '테스트 상품',
    price: 25000,
    mainImage: 'http://example.com/image.jpg',
    seller: mockSeller,
  } as Product;

  const mockOrderItem = {
    id: 'order-item-id',
    product: mockProduct,
    quantity: 2,
    price: 25000,
    totalPrice: 50000,
  } as OrderItem;

  const mockOrder = {
    id: 'order-id',
    user: mockUser,
    items: {
      getItems: () => [mockOrderItem],
    },
  } as unknown as Order;

  const mockDelivery = {
    id: 'delivery-id',
    order: mockOrder,
    seller: mockSeller,
    status: DeliveryStatus.SHIPPING,
    trackingNumber: '1234567890',
    courierCompany: 'CJ대한통운',
    recipientName: '수취인',
    recipientPhoneNumber: '010-1234-5678',
    address: '서울시 강남구 테스트동 123',
    shippedAt: new Date(),
    deliveredAt: undefined,
    canceledAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Delivery;

  beforeEach(async () => {
    mockDeliveryRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAll: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockOrderRepository = {
      findOne: jest.fn(),
    };

    mockOrderItemRepository = {
      findOne: jest.fn(),
    };

    mockEntityManager = {
      findOne: jest.fn(),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      assign: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockDeliveryRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: SqlEntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDeliveriesByOrderForViewer', () => {
    it('should return delivery information for a valid order', async () => {
      const orderId = 'order-id';
      const userId = 'user-id';

      // Mock entity manager findOne for order
      mockEntityManager.findOne.mockResolvedValue(mockOrder);

      // Mock delivery repository find
      mockDeliveryRepository.find.mockResolvedValue([mockDelivery]);

      const result = await service.findDeliveriesByOrderForViewer(orderId, userId);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        Order,
        { id: orderId, user: { id: userId } },
        { populate: ['items.product.seller', 'user'] },
      );

      expect(mockDeliveryRepository.find).toHaveBeenCalledWith(
        { order: mockOrder },
        { populate: ['order', 'order.items.product', 'seller'] },
      );

      expect(result.deliveries).toHaveLength(1);
      expect(result.deliveries[0].delivery).toBe(mockDelivery);
      expect(result.deliveries[0].seller.id).toBe('seller-id');
      expect(result.deliveries[0].seller.name).toBe('테스트 판매자');
      expect(result.deliveries[0].orderItems).toHaveLength(1);
      expect(result.deliveries[0].orderItems[0].productName).toBe('테스트 상품');
    });

    it('should throw NotFoundException when order is not found', async () => {
      const orderId = 'non-existent-order-id';
      const userId = 'user-id';

      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.findDeliveriesByOrderForViewer(orderId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.findDeliveriesByOrderForViewer(orderId, userId)).rejects.toThrow(
        '주문을 찾을 수 없거나 조회 권한이 없습니다.',
      );
    });

    it('should throw NotFoundException when user has no permission', async () => {
      const orderId = 'order-id';
      const wrongUserId = 'wrong-user-id';

      mockEntityManager.findOne.mockResolvedValue(null); // No order found for wrong user

      await expect(service.findDeliveriesByOrderForViewer(orderId, wrongUserId)).rejects.toThrow(NotFoundException);
    });

    it('should return empty deliveries array when no deliveries exist for order', async () => {
      const orderId = 'order-id';
      const userId = 'user-id';

      mockEntityManager.findOne.mockResolvedValue(mockOrder);
      mockDeliveryRepository.find.mockResolvedValue([]);

      const result = await service.findDeliveriesByOrderForViewer(orderId, userId);

      expect(result.deliveries).toHaveLength(0);
    });
  });
});

