import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UserRole } from '@/shared/enum/user-role.enum';
import { RefundStatus } from '@/shared/enum/refund-status.enum';
import { RefundService } from '@/module/refund/refund.service';
import { RefundEntity } from '@/module/refund/entity/refund.entity';
import { SellerRefundStatusUpdateDto } from '@/module/refund/dto/seller-refund-status-update.dto';
import { RefundStatusHistoryDto } from '@/module/refund/dto/refund-status-history.dto';
import { RefundController } from './refund.controller';

describe('RefundController', () => {
  let controller: RefundController;
  let mockRefundService: any;

  const mockSeller = {
    id: 'seller-id-1',
    name: '판매자1',
    role: UserRole.SELLER,
  };

  const mockRefund = {
    id: 'refund-id-1',
    status: RefundStatus.REQUESTED,
    reason: '상품 파손',
    statusMemo: '처리 중입니다.',
  };

  beforeEach(async () => {
    mockRefundService = {
      findSellerRefundsPaged: jest.fn(),
      updateRefundStatus: jest.fn(),
      getRefundStatusHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefundController],
      providers: [
        {
          provide: RefundService,
          useValue: mockRefundService,
        },
      ],
    }).compile();

    controller = module.get<RefundController>(RefundController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateRefundStatus', () => {
    it('반품 상태를 성공적으로 업데이트해야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.PROCESSING,
        memo: '배송 업체에서 회수 진행 중입니다.',
      };

      mockRefundService.updateRefundStatus.mockResolvedValue({
        ...mockRefund,
        status: RefundStatus.PROCESSING,
        statusMemo: '배송 업체에서 회수 진행 중입니다.',
      });

      const result = await controller.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any);

      expect(mockRefundService.updateRefundStatus).toHaveBeenCalledWith('refund-id-1', statusUpdateDto, mockSeller);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(RefundStatus.PROCESSING);
      expect(result.data.statusMemo).toBe('배송 업체에서 회수 진행 중입니다.');
    });

    it('서비스에서 발생한 에러를 그대로 전파해야 한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.PROCESSING,
      };

      mockRefundService.updateRefundStatus.mockRejectedValue(new BadRequestException('요청 형식이 올바르지 않습니다.'));

      await expect(controller.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getRefundStatusHistory', () => {
    it('반품 상태 변경 히스토리를 성공적으로 조회해야 한다', async () => {
      const mockHistories: RefundStatusHistoryDto[] = [
        {
          id: 'history-id-1',
          previousStatus: RefundStatus.REQUESTED,
          newStatus: RefundStatus.PROCESSING,
          changedById: 'seller-id-1',
          changedByName: '판매자1',
          memo: '배송 업체에서 회수 진행 중입니다.',
          createdAt: new Date('2023-07-01T14:00:00Z'),
        },
        {
          id: 'history-id-2',
          previousStatus: RefundStatus.PROCESSING,
          newStatus: RefundStatus.COMPLETED,
          changedById: 'seller-id-1',
          changedByName: '판매자1',
          memo: '반품 처리 완료했습니다.',
          createdAt: new Date('2023-07-02T10:00:00Z'),
        },
      ];

      mockRefundService.getRefundStatusHistory.mockResolvedValue(mockHistories);

      const result = await controller.getRefundStatusHistory('refund-id-1', mockSeller as any);

      expect(mockRefundService.getRefundStatusHistory).toHaveBeenCalledWith('refund-id-1', mockSeller);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('history-id-1');
      expect(result.data[0].previousStatus).toBe(RefundStatus.REQUESTED);
      expect(result.data[0].newStatus).toBe(RefundStatus.PROCESSING);
      expect(result.data[1].id).toBe('history-id-2');
      expect(result.data[1].newStatus).toBe(RefundStatus.COMPLETED);
    });

    it('존재하지 않는 반품의 히스토리를 조회하려고 하면 NotFoundException이 발생해야 한다', async () => {
      mockRefundService.getRefundStatusHistory.mockRejectedValue(
        new NotFoundException('반품 요청을 찾을 수 없습니다.'),
      );

      await expect(controller.getRefundStatusHistory('non-existent-id', mockSeller as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

