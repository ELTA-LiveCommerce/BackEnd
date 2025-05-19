import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from '@/module/order/order.service';
import { AdminOrderListRequest, AdminUpdateOrderStatusRequest } from './dto/admin-order-request.dto';
import { AdminOrderResponse, AdminOrderListResponse } from './dto/admin-order-response.dto';
import { OrderStatus } from '@/shared/enum/order-status.enum';

describe('AdminOrderController', () => {
  let controller: AdminOrderController;
  let orderService: OrderService;

  const mockOrderService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockOrderItem = {
    id: 'test-order-item-id',
    product: { id: 'test-product-id', name: 'Test Product' },
    price: 10000,
    quantity: 2,
  };

  const mockOrder = {
    id: 'test-order-id',
    user: { id: 'test-user-id' },
    status: OrderStatus.PENDING,
    totalAmount: 20000,
    shippingAddress: '서울시 강남구',
    items: [mockOrderItem],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminOrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<AdminOrderController>(AdminOrderController);
    orderService = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOrders', () => {
    it('주문 목록을 반환해야 함', async () => {
      // Given
      const query: AdminOrderListRequest = {
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING,
        search: 'test',
        userId: 'test-user-id',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      const orders = [mockOrder];
      const total = 1;

      mockOrderService.findAll.mockResolvedValue({
        items: orders,
        total,
      });

      // When
      const result = await controller.getOrders(query);

      // Then
      expect(orderService.findAll).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
        status: query.status,
        search: query.search,
        userId: query.userId,
        startDate: query.startDate,
        endDate: query.endDate,
      });
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data.total).toBe(total);
      expect(result.data.items.length).toBe(orders.length);
    });
  });

  describe('getOrder', () => {
    it('주문 ID로 단일 주문을 반환해야 함', async () => {
      // Given
      const orderId = 'test-order-id';
      mockOrderService.findOne.mockResolvedValue(mockOrder);

      // When
      const result = await controller.getOrder(orderId);

      // Then
      expect(orderService.findOne).toHaveBeenCalledWith(orderId);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('id', mockOrder.id);
    });
  });

  describe('updateOrderStatus', () => {
    it('주문 상태를 업데이트하고 반환해야 함', async () => {
      // Given
      const orderId = 'test-order-id';
      const updateStatusDto: AdminUpdateOrderStatusRequest = {
        status: OrderStatus.SHIPPED,
        reason: '배송 시작',
      };

      const updatedOrder = { ...mockOrder, status: OrderStatus.SHIPPED };
      mockOrderService.updateStatus.mockResolvedValue(updatedOrder);

      // When
      const result = await controller.updateOrderStatus(orderId, updateStatusDto);

      // Then
      expect(orderService.updateStatus).toHaveBeenCalledWith(orderId, updateStatusDto.status);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data.status).toBe(OrderStatus.SHIPPED);
    });
  });
});

