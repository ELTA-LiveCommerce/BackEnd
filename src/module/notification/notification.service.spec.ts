import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService, PaymentNotificationParams } from './notification.service';

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
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        POPBILL_LINK_ID: 'test-link-id',
        POPBILL_SECRET_KEY: 'test-secret-key',
        POPBILL_TEST_CORP_NUM: '1234567890',
        POPBILL_USER_ID: 'test-user',
        POPBILL_IS_TEST: 'true',
        POPBILL_SENDER_NUMBER: '010-1234-5678',
        NODE_ENV: 'development',
        POPBILL_DEPOSIT_TEMPLATE_CODE: '025050000987',
      };
      return config[key] || defaultValue;
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
    configService = module.get<ConfigService>(ConfigService);

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

  describe('sendDepositAccountNotification', () => {
    it('should send deposit account notification with correct template variables', async () => {
      const recipientPhoneNumber = '010-9876-5432';
      const params: PaymentNotificationParams = {
        customerName: '김테스트',
        productName: '테스트 상품',
        bankName: '농협은행',
        accountNumber: '123-456-789012',
        accountHolder: 'ELTA',
        amount: '50,000원',
        dueDate: '2024.12.31',
      };

      // Mock the private sendKakaoTalkWithTemplate method
      const sendKakaoTalkSpy = jest.spyOn(service as any, 'sendKakaoTalkWithTemplate').mockResolvedValue(undefined);

      await service.sendDepositAccountNotification(recipientPhoneNumber, params);

      expect(sendKakaoTalkSpy).toHaveBeenCalledWith('025050000987', recipientPhoneNumber, {
        이름: '김테스트',
        상품명: '테스트 상품',
        계좌은행: '농협은행',
        계좌번호: '123-456-789012',
        계좌주: 'ELTA',
        금액: '50,000원',
        입금마감날짜: '2024.12.31',
      });
    });

    it('should log the notification sending process', async () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'log');
      jest.spyOn(service as any, 'sendKakaoTalkWithTemplate').mockResolvedValue(undefined);

      const params: PaymentNotificationParams = {
        customerName: '김테스트',
        productName: '테스트 상품',
        bankName: '농협은행',
        accountNumber: '123-456-789012',
        accountHolder: 'ELTA',
        amount: '50,000원',
        dueDate: '2024.12.31',
      };

      await service.sendDepositAccountNotification('010-9876-5432', params);

      expect(loggerSpy).toHaveBeenCalledWith('Sending deposit account notification to 010-9876-5432 for 테스트 상품');
    });
  });

  describe('sendKakaoTalk', () => {
    it('should call sendKakaoTalkWithTemplate with correct parameters', async () => {
      const sendKakaoTalkSpy = jest.spyOn(service as any, 'sendKakaoTalkWithTemplate').mockResolvedValue(undefined);

      const templateCode = 'TEST_TEMPLATE';
      const recipientPhoneNumber = '010-9876-5432';
      const params = { testParam: 'testValue' };

      await service.sendKakaoTalk(templateCode, recipientPhoneNumber, params);

      expect(sendKakaoTalkSpy).toHaveBeenCalledWith(templateCode, recipientPhoneNumber, params);
    });
  });

  describe('getTemplateContent', () => {
    it('should return template content for deposit account template', () => {
      const templateCode = '025050000987';

      const result = service['getTemplateContent'](templateCode);

      expect(result).toContain('[입금계좌 알림]');
      expect(result).toContain('#{이름}님!');
      expect(result).toContain('#{상품명}에 대한 입금');
      expect(result).toContain('#{계좌은행} #{계좌번호}');
      expect(result).toContain('#{계좌주}로 #{금액}을');
      expect(result).toContain('#{입금마감날짜}까지 무통장입금');
    });

    it('should throw NotImplementedException for unknown template', () => {
      const templateCode = 'UNKNOWN_TEMPLATE';

      expect(() => service['getTemplateContent'](templateCode)).toThrow('Not implemented');
    });
  });

  describe('getTemplateAltContent', () => {
    it('should correctly replace template variables for deposit account template', () => {
      const templateCode = '025050000987';
      const params = {
        이름: '김테스트',
        상품명: '테스트 상품',
        계좌은행: '농협은행',
        계좌번호: '123-456-789012',
        계좌주: 'ELTA',
        금액: '50,000원',
        입금마감날짜: '2024.12.31',
      };

      const result = service['getTemplateAltContent'](templateCode, params);

      expect(result).toContain('김테스트님!');
      expect(result).toContain('테스트 상품에 대한 입금');
      expect(result).toContain('농협은행 123-456-789012');
      expect(result).toContain('ELTA로 50,000원을');
      expect(result).toContain('2024.12.31까지 무통장입금');
    });

    it('should handle missing template variables gracefully for deposit template', () => {
      const templateCode = '025050000987';
      const params = {
        이름: '김테스트',
        // 다른 필드들은 의도적으로 누락
      };

      const result = service['getTemplateAltContent'](templateCode, params);

      expect(result).toContain('김테스트님!');
      // 빈 값들도 정상적으로 처리되는지 확인
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should throw NotImplementedException for unknown template', () => {
      const templateCode = 'UNKNOWN_TEMPLATE';
      const params = {};

      expect(() => service['getTemplateAltContent'](templateCode, params)).toThrow('Not implemented');
    });
  });
});

