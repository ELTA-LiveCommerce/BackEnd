import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';
import { RefundStatus } from '@/shared/enum/refund-status.enum';
import { OrderStatus } from '@/shared/enum/order-status.enum';

import { RefundService } from './refund.service';
import { RefundEntity } from './entity/refund.entity';
import { SellerRefundStatusUpdateDto } from './dto/seller-refund-status-update.dto';

describe('RefundService', () => {
  let service: RefundService;
  let mockRefundRepository: any;
  let mockEntityManager: any;

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

    mockEntityManager = {
      persistAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundService,
        {
          provide: getRepositoryToken(RefundEntity),
          useValue: mockRefundRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
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
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalled();
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
      expect(mockRefundWithProcessingStatus.orderItem.order.status).toBe(OrderStatus.REFUNDED);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledTimes(2);
    });
  });
});
