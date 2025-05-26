import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';
import { RefundStatus } from '@/shared/enum/refund-status.enum';
import { OrderStatus } from '@/shared/enum/order-status.enum';
import { OrderService } from '@/module/order/order.service';

import { RefundService } from './refund.service';
import { RefundEntity } from './entity/refund.entity';
import { RefundStatusHistoryEntity } from './entity/refund-status-history.entity';
import { RefundStatusHistoryRepository } from './repository/refund-status-history.repository';
import { SellerRefundStatusUpdateDto } from './dto/seller-refund-status-update.dto';

describe('RefundService', () => {
  let service: RefundService;
  let mockRefundRepository: any;
  let mockRefundHistoryRepository: any;
  let mockEntityManager: any;
  let mockOrderService: any;

  const mockSeller = {
    id: 'seller-id-1',
    name: '판매자1',
    role: UserRole.SELLER,
  };

  const mockViewer = {
    id: 'user-id-1',
    name: '사용자1',
    role: UserRole.VIEWER,
  };

  const mockOrder = {
    id: 'order-id-1',
    status: OrderStatus.PAID,
  };

  const mockOrderItem = {
    id: 'order-item-id-1',
    order: mockOrder,
  };

  const mockRefund = {
    id: 'refund-id-1',
    status: RefundStatus.REQUESTED,
    seller: mockSeller,
    buyer: mockViewer,
    orderItem: mockOrderItem,
    reason: '상품 파손',
    quantity: 1,
    returnAddress: '서울시 강남구',
    statusMemo: '',
  };

  beforeEach(async () => {
    mockRefundRepository = {
      findOne: jest.fn(),
    };

    mockRefundHistoryRepository = {
      persist: jest.fn(),
      findByRefundId: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
    };

    mockOrderService = {
      markOrderAsRefunded: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundService,
        {
          provide: getRepositoryToken(RefundEntity),
          useValue: mockRefundRepository,
        },
        {
          provide: getRepositoryToken(RefundStatusHistoryEntity),
          useValue: mockRefundHistoryRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    service = module.get<RefundService>(RefundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateRefundStatus', () => {
    it('판매자가 반품 상태를 처리중으로 변경할 수 있어야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.PROCESSING,
        memo: '현재 배송 업체에서 회수 진행 중입니다.',
      };

      mockRefundRepository.findOne.mockResolvedValue({ ...mockRefund });

      await service.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any);

      expect(mockRefundRepository.findOne).toHaveBeenCalledWith(
        { id: 'refund-id-1', seller: { id: mockSeller.id } },
        { populate: ['orderItem', 'orderItem.order'] },
      );
      expect(mockRefundHistoryRepository.persist).toHaveBeenCalled();
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();

      // 상태 변경 히스토리가 올바르게 생성되었는지 확인
      const historyCall = mockRefundHistoryRepository.persist.mock.calls[0][0];
      expect(historyCall.previousStatus).toBe(RefundStatus.REQUESTED);
      expect(historyCall.newStatus).toBe(RefundStatus.PROCESSING);
      expect(historyCall.memo).toBe('현재 배송 업체에서 회수 진행 중입니다.');
      expect(historyCall.refund.id).toBe('refund-id-1');
      expect(historyCall.changedBy.id).toBe(mockSeller.id);
    });

    it('판매자가 아닌 사용자가 반품 상태를 변경하려고 하면 ForbiddenException이 발생해야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.PROCESSING,
      };

      await expect(service.updateRefundStatus('refund-id-1', statusUpdateDto, mockViewer as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('존재하지 않는 반품에 대해 상태 변경을 시도하면 NotFoundException이 발생해야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.PROCESSING,
      };

      mockRefundRepository.findOne.mockResolvedValue(null);

      await expect(service.updateRefundStatus('non-existent-id', statusUpdateDto, mockSeller as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('이미 완료된 반품 상태를 변경하려고 하면 BadRequestException이 발생해야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.PROCESSING,
      };

      mockRefundRepository.findOne.mockResolvedValue({
        ...mockRefund,
        status: RefundStatus.COMPLETED,
      });

      await expect(service.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('요청 상태에서 바로 완료 상태로 변경하려고 하면 BadRequestException이 발생해야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.COMPLETED,
      };

      mockRefundRepository.findOne.mockResolvedValue({
        ...mockRefund,
        status: RefundStatus.REQUESTED,
      });

      await expect(service.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('반품 거부 시 메모가 없으면 BadRequestException이 발생해야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.REJECTED,
        // memo가 없음
      };

      mockRefundRepository.findOne.mockResolvedValue({
        ...mockRefund,
        status: RefundStatus.REQUESTED,
      });

      await expect(service.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('반품 완료로 변경 시 주문 상태도 변경되어야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.COMPLETED,
        memo: '반품 처리 완료하였습니다.',
      };

      const mockRefundWithProcessingStatus = {
        ...mockRefund,
        status: RefundStatus.PROCESSING,
      };

      mockRefundRepository.findOne.mockResolvedValue(mockRefundWithProcessingStatus);

      await service.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any);

      expect(mockRefundWithProcessingStatus.status).toBe(RefundStatus.COMPLETED);
      expect(mockRefundWithProcessingStatus.statusMemo).toBe('반품 처리 완료하였습니다.');
      expect(mockOrderService.markOrderAsRefunded).toHaveBeenCalledWith(
        mockRefundWithProcessingStatus.orderItem.order.id,
      );
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();

      // 히스토리 생성 확인
      expect(mockRefundHistoryRepository.persist).toHaveBeenCalled();
      const historyCall = mockRefundHistoryRepository.persist.mock.calls[0][0];
      expect(historyCall.previousStatus).toBe(RefundStatus.PROCESSING);
      expect(historyCall.newStatus).toBe(RefundStatus.COMPLETED);
    });
  });

  describe('getRefundStatusHistory', () => {
    it('반품 상태 변경 히스토리를 조회할 수 있어야 한다', async () => {
      const mockHistories = [
        {
          id: 'history-id-1',
          refund: { id: 'refund-id-1' },
          previousStatus: RefundStatus.REQUESTED,
          newStatus: RefundStatus.PROCESSING,
          changedBy: { id: 'seller-id-1', name: '판매자1' },
          memo: '회수 진행 중입니다.',
          createdAt: new Date('2023-07-01T14:00:00Z'),
        },
        {
          id: 'history-id-2',
          refund: { id: 'refund-id-1' },
          previousStatus: RefundStatus.PROCESSING,
          newStatus: RefundStatus.COMPLETED,
          changedBy: { id: 'seller-id-1', name: '판매자1' },
          memo: '처리 완료했습니다.',
          createdAt: new Date('2023-07-02T10:00:00Z'),
        },
      ];

      mockRefundRepository.findOne.mockResolvedValue(mockRefund);
      mockRefundHistoryRepository.findByRefundId.mockResolvedValue(mockHistories);

      const result = await service.getRefundStatusHistory('refund-id-1', mockSeller as any);

      expect(mockRefundRepository.findOne).toHaveBeenCalledWith({
        id: 'refund-id-1',
        seller: { id: mockSeller.id },
      });
      expect(mockRefundHistoryRepository.findByRefundId).toHaveBeenCalledWith('refund-id-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('history-id-1');
      expect(result[0].previousStatus).toBe(RefundStatus.REQUESTED);
      expect(result[0].newStatus).toBe(RefundStatus.PROCESSING);
      expect(result[0].changedById).toBe('seller-id-1');
      expect(result[0].changedByName).toBe('판매자1');
      expect(result[0].memo).toBe('회수 진행 중입니다.');
      expect(result[0].createdAt).toEqual(new Date('2023-07-01T14:00:00Z'));

      expect(result[1].id).toBe('history-id-2');
      expect(result[1].previousStatus).toBe(RefundStatus.PROCESSING);
      expect(result[1].newStatus).toBe(RefundStatus.COMPLETED);
    });

    it('존재하지 않는 반품의 히스토리를 조회하려고 하면 NotFoundException이 발생해야 한다', async () => {
      mockRefundRepository.findOne.mockResolvedValue(null);

      await expect(service.getRefundStatusHistory('non-existent-id', mockSeller as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

