import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { RefundService } from '@/module/refund/refund.service';
import { RefundStatus } from '@/shared/enum/refund-status.enum';
import { UserRole } from '@/shared/enum/user-role.enum';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

import { RefundController } from './refund.controller';
import { SellerRefundStatusUpdateDto } from '@/module/refund/dto/seller-refund-status-update.dto';

describe('RefundController', () => {
  let controller: RefundController;
  let mockRefundService: any;

  const mockRefund = {
    id: 'refund-id-1',
    status: RefundStatus.PROCESSING,
    statusMemo: '처리 중입니다',
  };

  const mockSeller = {
    id: 'seller-id-1',
    name: '판매자1',
    role: UserRole.SELLER,
  };

  beforeEach(async () => {
    mockRefundService = {
      findSellerRefundsPaged: jest.fn(),
      updateRefundStatus: jest.fn(),
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

  describe('getSellerRefunds', () => {
    it('판매자의 반품 목록을 조회한다', async () => {
      // PagedResponseV2 형식으로 mock 결과 생성
      const pagedResponse = PagedResponseV2.create([mockRefund], 1, 1, 10);

      mockRefundService.findSellerRefundsPaged.mockResolvedValue(pagedResponse);

      const result = await controller.getSellerRefunds({ page: 1, limit: 10 }, mockSeller as any);

      expect(result).toBe(pagedResponse);
      expect(result.data.items).toHaveLength(1);
      expect(mockRefundService.findSellerRefundsPaged).toHaveBeenCalledWith('seller-id-1', { page: 1, limit: 10 });
    });
  });

  describe('updateRefundStatus', () => {
    it('판매자가 반품 상태를 변경할 수 있다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.COMPLETED,
        memo: '반품 완료 처리하였습니다',
      };

      mockRefundService.updateRefundStatus.mockResolvedValue({
        ...mockRefund,
        status: RefundStatus.COMPLETED,
        statusMemo: '반품 완료 처리하였습니다',
      });

      const result = await controller.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(RefundStatus.COMPLETED);
      expect(mockRefundService.updateRefundStatus).toHaveBeenCalledWith('refund-id-1', statusUpdateDto, mockSeller);
    });

    it('서비스에서 예외가 발생하면 컨트롤러에서도 같은 예외가 발생한다', async () => {
      const statusUpdateDto: SellerRefundStatusUpdateDto = {
        status: RefundStatus.REJECTED,
        // memo 없음
      };

      mockRefundService.updateRefundStatus.mockRejectedValue(
        new BadRequestException('반품 거부 시에는 반드시 사유를 입력해야 합니다.'),
      );

      await expect(controller.updateRefundStatus('refund-id-1', statusUpdateDto, mockSeller as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

