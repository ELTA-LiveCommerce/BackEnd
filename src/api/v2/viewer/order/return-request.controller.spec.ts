import { Test, TestingModule } from '@nestjs/testing';
import { ReturnRequestController } from './return-request.controller';
import { ReturnRequestService } from '@/module/order/return-request.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { User } from '@/module/user/entity/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { CreateReturnRequestRequest } from './return-request-request.dto';
import { ReturnStatus } from '@/module/order/entity/return-request.entity';
import { ReturnPickupType } from '@/shared/enum/return-pickup-type.enum';
import { ReturnReasonCategory, ReturnReasonDetail } from '@/shared/enum/return-reason.enum';
import { Order } from '@/module/order/entity/order.entity';

describe('ReturnRequestController', () => {
  let controller: ReturnRequestController;
  let returnRequestService: MockProxy<ReturnRequestService>;

  const mockUser = {
    id: 'test-user-id',
    name: '테스트 사용자',
    loginId: 'testuser',
  } as User;

  const mockOrder = {
    id: 'test-order-id',
    user: mockUser,
    orderNumber: 'ORD20240601123456',
    items: [],
    totalAmount: 50000,
  } as unknown as Order;

  const mockReturnRequest = {
    id: 'test-return-request-id',
    order: mockOrder,
    reasonCategory: ReturnReasonCategory.PRODUCT_ISSUE,
    reasonDetail: ReturnReasonDetail.DAMAGED_PRODUCT,
    status: ReturnStatus.REQUESTED,
    pickupName: '홍길동',
    pickupAddress: '서울시 강남구 테스트동 123',
    pickupType: ReturnPickupType.DOOR_FRONT,
    pickupNote: '경비실에 맡겨주세요',
    requestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    returnRequestService = mock<ReturnRequestService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReturnRequestController],
      providers: [
        {
          provide: ReturnRequestService,
          useValue: returnRequestService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReturnRequestController>(ReturnRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a return request', async () => {
      const createReturnRequestRequest: CreateReturnRequestRequest = {
        orderId: 'test-order-id',
        reasonCategory: ReturnReasonCategory.PRODUCT_ISSUE,
        reasonDetail: ReturnReasonDetail.DAMAGED_PRODUCT,
        pickupName: '홍길동',
        pickupAddress: '서울시 강남구 테스트동 123',
        pickupType: ReturnPickupType.DOOR_FRONT,
        pickupNote: '경비실에 맡겨주세요',
      };

      returnRequestService.create.mockResolvedValue(mockReturnRequest);

      const result = await controller.create(mockUser, createReturnRequestRequest);

      expect(returnRequestService.create).toHaveBeenCalledWith(expect.any(Object), mockUser.id);
      expect(result.data.id).toBe(mockReturnRequest.id);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('findAll', () => {
    it('should return a list of return requests', async () => {
      returnRequestService.findByUserId.mockResolvedValue([mockReturnRequest]);

      const result = await controller.findAll(mockUser);

      expect(returnRequestService.findByUserId).toHaveBeenCalledWith(mockUser.id);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockReturnRequest.id);
      expect(result.success).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a specific return request', async () => {
      const returnRequestId = 'test-return-request-id';

      returnRequestService.findOne.mockResolvedValue(mockReturnRequest);

      const result = await controller.findOne(returnRequestId, mockUser);

      expect(returnRequestService.findOne).toHaveBeenCalledWith(returnRequestId, mockUser.id);
      expect(result.data.id).toBe(mockReturnRequest.id);
      expect(result.success).toBe(true);
    });
  });
});

