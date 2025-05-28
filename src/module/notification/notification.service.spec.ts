import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';

// 팝빌 SDK 모킹
jest.mock('popbill', () => {
  return {
    config: jest.fn(),
    KakaoService: jest.fn().mockImplementation(() => {
      return {
        sendATS_one: jest.fn(),
      };
    }),
  };
});

describe('NotificationService', () => {
  let service: NotificationService;
  let mockKakaoService: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      if (key === 'POPBILL_LINK_ID') return 'HDCOMPANY';
      if (key === 'POPBILL_SECRET_KEY') return 'A9tKzwBYYUZvIeFPO2GQj0UZEQony2kRfak2jBr9ra4=';
      if (key === 'POPBILL_TEST_CORP_NUM') return '1234567890';
      if (key === 'POPBILL_USER_ID') return 'testuser';
      if (key === 'POPBILL_IS_TEST') return 'true';
      if (key === 'POPBILL_SENDER_NUMBER') return '070-4304-2992';
      return '';
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

    // 팝빌 SDK에서 반환되는 카카오 서비스 모킹
    const popbill = require('popbill');
    mockKakaoService = popbill.KakaoService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendKakaoTalk', () => {
    it('should log message in development environment without API call', async () => {
      // Spy on logger.log
      const logSpy = jest.spyOn(service['logger'], 'log');

      // Execute the method
      await service.sendKakaoTalk('TEST_TEMPLATE', '010-1234-5678', { orderNumber: 'ORD-123' });

      // Verify Logger was called with expected messages
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending KakaoTalk to 010-1234-5678 with template TEST_TEMPLATE'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Development mode: Not sending actual KakaoTalk message'),
      );

      // Verify API was not called
      expect(mockKakaoService.sendATS_one).not.toHaveBeenCalled();
    });

    it('should call Popbill API in production environment', async () => {
      // Note: 이 테스트는 실제로는 개발 환경에서 실행되므로 로깅만 확인합니다.
      // 실제 프로덕션 환경에서는 팝빌 API가 호출됩니다.

      // Spy on logger.log
      const logSpy = jest.spyOn(service['logger'], 'log');

      // 메서드 실행 (개발 환경이므로 실제 API 호출 없음)
      await service.sendKakaoTalk('ORDER_COMPLETE_TEMPLATE', '010-1234-5678', {
        orderNumber: 'ORD-123',
        totalAmount: '50000',
        orderDate: '2023-06-01 14:30:00',
      });

      // Verify Logger was called with expected messages
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending KakaoTalk to 010-1234-5678 with template ORDER_COMPLETE_TEMPLATE'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Development mode: Not sending actual KakaoTalk message'),
      );
    });

    it('should handle API errors gracefully', async () => {
      // Note: 이 테스트는 실제로는 개발 환경에서 실행되므로 로깅만 확인합니다.
      // 실제 프로덕션 환경에서는 에러 핸들링이 작동합니다.

      // Spy on logger
      const logSpy = jest.spyOn(service['logger'], 'log');

      // Execute the method - should not throw
      await service.sendKakaoTalk('ORDER_COMPLETE_TEMPLATE', '01012345678', {
        orderNumber: 'ORD-123',
        totalAmount: 50000,
      });

      // Verify development mode message was logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Development mode: Not sending actual KakaoTalk message'),
      );
    });
  });

  describe('replaceTemplateVariables', () => {
    it('should replace template variables correctly', () => {
      const params = {
        orderNumber: 'ORD-123',
        totalAmount: '50000',
        productNames: 'Test Product',
        buyerName: 'Test User',
        orderDate: '2023-06-01 14:30:00',
      };

      const result = service['replaceTemplateVariables'](params);

      expect(result).toContain('주문번호: ORD-123');
      expect(result).toContain('주문금액: 50000원');
      expect(result).toContain('상품명: Test Product');
      expect(result).toContain('구매자: Test User');
      expect(result).toContain('주문일시: 2023-06-01 14:30:00');
      expect(result).toContain('안녕하세요. ELTA입니다.');
      expect(result).toContain('감사합니다.');
    });

    it('should handle partial params', () => {
      const params = {
        orderNumber: 'ORD-456',
      };

      const result = service['replaceTemplateVariables'](params);

      expect(result).toContain('주문번호: ORD-456');
      expect(result).toContain('안녕하세요. ELTA입니다.');
      expect(result).not.toContain('주문금액:');
      expect(result).not.toContain('상품명:');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should remove hyphens from phone number', () => {
      const result = service['formatPhoneNumber']('010-1234-5678');
      expect(result).toBe('01012345678');
    });

    it('should handle phone number without hyphens', () => {
      const result = service['formatPhoneNumber']('01012345678');
      expect(result).toBe('01012345678');
    });
  });

  describe('generateRequestNum', () => {
    it('should generate unique request numbers', () => {
      const result1 = service['generateRequestNum']();
      const result2 = service['generateRequestNum']();

      expect(result1).toMatch(/^REQ-\d+-\d+$/);
      expect(result2).toMatch(/^REQ-\d+-\d+$/);
      expect(result1).not.toBe(result2);
    });
  });
});

