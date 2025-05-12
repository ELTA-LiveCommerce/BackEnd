import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityRepository, QueryBuilder } from '@mikro-orm/postgresql';

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

describe('DepositService', () => {
  let service: DepositService;
  let repository: EntityRepository<Order>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {},
        },
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
      orderNumber: 'ORDER-001',
      status: OrderStatus.PAID,
      items: {
        getItems: jest.fn(() => [mockOrderItemA]),
        count: jest.fn(() => 1),
      } as any,
      totalAmount: 10000,
      shippingAddress: 'Address A Detail A',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
    } as Order;

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
      expect(result.data.items[0].productName).toBe(mockOrders[0].items.getItems()[0].product.name);
      expect(result.data.items[0].quantity).toBe(mockOrders[0].items.getItems()[0].quantity);
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
});
