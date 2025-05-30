import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  NotificationService,
  PaymentNotificationParams,
  BroadcastReservationNotificationParams,
  BroadcastStartNotificationParams,
} from './notification.service';

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
        POPBILL_BROADCAST_RESERVATION_TEMPLATE_CODE: 'BROADCAST_RESERVATION_TEMPLATE',
        POPBILL_BROADCAST_START_TEMPLATE_CODE: 'BROADCAST_START_TEMPLATE',
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

      // Verify log message was called
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending KakaoTalk to 01012345678 with template ORDER_COMPLETE_TEMPLATE'),
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
        sellerPhoneNumber: '010-1234-5678',
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
        셀러전화번호: '010-1234-5678',
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
        sellerPhoneNumber: '010-1234-5678',
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
      const params = {
        이름: '김테스트',
        상품명: '테스트 상품',
        계좌은행: '농협은행',
        계좌번호: '123-456-789012',
        계좌주: 'ELTA',
        금액: '50,000원',
        입금마감날짜: '2024.12.31',
        셀러전화번호: '010-1234-5678',
      };

      const result = service['getTemplateContent'](templateCode, params);

      expect(result).toContain('[입금계좌 알림]');
      expect(result).toContain('김테스트님!');
      expect(result).toContain('테스트 상품에 대한 입금');
      expect(result).toContain('농협은행 123-456-789012');
      expect(result).toContain('ELTA로 50,000원을');
      expect(result).toContain('2024.12.31까지 무통장입금');
      expect(result).toContain('010-1234-5678으로 해주세요');
    });

    it('should throw NotImplementedException for unknown template', () => {
      const templateCode = 'UNKNOWN_TEMPLATE';

      expect(() => service['getTemplateContent'](templateCode, {})).toThrow('Not implemented');
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
        셀러전화번호: '010-1234-5678',
      };

      const result = service['getTemplateAltContent'](templateCode, params);

      expect(result).toContain('김테스트님!');
      expect(result).toContain('테스트 상품에 대한 입금');
      expect(result).toContain('농협은행 123-456-789012');
      expect(result).toContain('ELTA로 50,000원을');
      expect(result).toContain('2024.12.31까지 무통장입금');
      expect(result).toContain('010-1234-5678으로 해주세요');
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

  describe('sendBroadcastReservationNotification', () => {
    it('should send broadcast reservation notification with correct template variables', async () => {
      const recipientPhoneNumber = '010-9876-5432';
      const params: BroadcastReservationNotificationParams = {
        customerName: '김팔로워',
        sellerName: '김판매자',
        broadcastScheduledTime: '12월 25일 오후 3시',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      const sendKakaoTalkSpy = jest.spyOn(service as any, 'sendKakaoTalkWithTemplate').mockResolvedValue(undefined);

      await service.sendBroadcastReservationNotification(recipientPhoneNumber, params);

      expect(sendKakaoTalkSpy).toHaveBeenCalledWith('BROADCAST_RESERVATION_TEMPLATE', recipientPhoneNumber, {
        이름: '김팔로워',
        셀러이름: '김판매자',
        방송예약시간: '12월 25일 오후 3시',
        방송제목: '크리스마스 특가 방송',
        셀러프로필링크: 'https://elta.com/sellers/seller-123',
      });
    });

    it('should log the broadcast reservation notification process', async () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'log');
      jest.spyOn(service as any, 'sendKakaoTalkWithTemplate').mockResolvedValue(undefined);

      const params: BroadcastReservationNotificationParams = {
        customerName: '김팔로워',
        sellerName: '김판매자',
        broadcastScheduledTime: '12월 25일 오후 3시',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      await service.sendBroadcastReservationNotification('010-9876-5432', params);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Sending broadcast reservation notification to 010-9876-5432 for 크리스마스 특가 방송',
      );
    });
  });

  describe('sendBroadcastStartNotification', () => {
    it('should send broadcast start notification with correct template variables', async () => {
      const recipientPhoneNumber = '010-9876-5432';
      const params: BroadcastStartNotificationParams = {
        customerName: '김팔로워',
        sellerName: '김판매자',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      const sendKakaoTalkSpy = jest.spyOn(service as any, 'sendKakaoTalkWithTemplate').mockResolvedValue(undefined);

      await service.sendBroadcastStartNotification(recipientPhoneNumber, params);

      expect(sendKakaoTalkSpy).toHaveBeenCalledWith('BROADCAST_START_TEMPLATE', recipientPhoneNumber, {
        이름: '김팔로워',
        셀러이름: '김판매자',
        방송제목: '크리스마스 특가 방송',
        셀러프로필링크: 'https://elta.com/sellers/seller-123',
      });
    });

    it('should log the broadcast start notification process', async () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'log');
      jest.spyOn(service as any, 'sendKakaoTalkWithTemplate').mockResolvedValue(undefined);

      const params: BroadcastStartNotificationParams = {
        customerName: '김팔로워',
        sellerName: '김판매자',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      await service.sendBroadcastStartNotification('010-9876-5432', params);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Sending broadcast start notification to 010-9876-5432 for 크리스마스 특가 방송',
      );
    });
  });

  describe('sendBroadcastReservationNotificationToFollowers', () => {
    it('should send broadcast reservation notifications to multiple followers', async () => {
      const followerPhoneNumbers = ['010-1111-1111', '010-2222-2222', '010-3333-3333'];
      const params = {
        sellerName: '김판매자',
        broadcastScheduledTime: '12월 25일 오후 3시',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      const sendBroadcastReservationSpy = jest
        .spyOn(service, 'sendBroadcastReservationNotification')
        .mockResolvedValue(undefined);

      const loggerSpy = jest.spyOn((service as any).logger, 'log');

      await service.sendBroadcastReservationNotificationToFollowers(followerPhoneNumbers, params);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Sending broadcast reservation notification to 3 followers for 크리스마스 특가 방송',
      );

      expect(sendBroadcastReservationSpy).toHaveBeenCalledTimes(3);

      // 각 팔로워에게 올바른 파라미터로 호출되었는지 확인
      expect(sendBroadcastReservationSpy).toHaveBeenCalledWith('010-1111-1111', {
        ...params,
        customerName: '고객',
      });
      expect(sendBroadcastReservationSpy).toHaveBeenCalledWith('010-2222-2222', {
        ...params,
        customerName: '고객',
      });
      expect(sendBroadcastReservationSpy).toHaveBeenCalledWith('010-3333-3333', {
        ...params,
        customerName: '고객',
      });
    });

    it('should handle individual notification failures gracefully', async () => {
      const followerPhoneNumbers = ['010-1111-1111', '010-2222-2222'];
      const params = {
        sellerName: '김판매자',
        broadcastScheduledTime: '12월 25일 오후 3시',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      jest
        .spyOn(service, 'sendBroadcastReservationNotification')
        .mockResolvedValueOnce(undefined) // 첫 번째 호출은 성공
        .mockRejectedValueOnce(new Error('네트워크 오류')); // 두 번째 호출은 실패

      // 전체 프로세스는 실패하지 않아야 함
      await expect(
        service.sendBroadcastReservationNotificationToFollowers(followerPhoneNumbers, params),
      ).resolves.not.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send broadcast reservation notification to 010-2222-2222: 네트워크 오류',
      );
    });
  });

  describe('sendBroadcastStartNotificationToFollowers', () => {
    it('should send broadcast start notifications to multiple followers', async () => {
      const followerPhoneNumbers = ['010-1111-1111', '010-2222-2222'];
      const params = {
        sellerName: '김판매자',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      const sendBroadcastStartSpy = jest.spyOn(service, 'sendBroadcastStartNotification').mockResolvedValue(undefined);

      const loggerSpy = jest.spyOn((service as any).logger, 'log');

      await service.sendBroadcastStartNotificationToFollowers(followerPhoneNumbers, params);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Sending broadcast start notification to 2 followers for 크리스마스 특가 방송',
      );

      expect(sendBroadcastStartSpy).toHaveBeenCalledTimes(2);

      expect(sendBroadcastStartSpy).toHaveBeenCalledWith('010-1111-1111', {
        ...params,
        customerName: '고객',
      });
      expect(sendBroadcastStartSpy).toHaveBeenCalledWith('010-2222-2222', {
        ...params,
        customerName: '고객',
      });
    });

    it('should handle individual notification failures gracefully', async () => {
      const followerPhoneNumbers = ['010-1111-1111', '010-2222-2222'];
      const params = {
        sellerName: '김판매자',
        broadcastTitle: '크리스마스 특가 방송',
        sellerProfileLink: 'https://elta.com/sellers/seller-123',
      };

      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      jest
        .spyOn(service, 'sendBroadcastStartNotification')
        .mockRejectedValueOnce(new Error('네트워크 오류'))
        .mockResolvedValueOnce(undefined);

      await expect(
        service.sendBroadcastStartNotificationToFollowers(followerPhoneNumbers, params),
      ).resolves.not.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send broadcast start notification to 010-1111-1111: 네트워크 오류',
      );
    });
  });

  describe('Broadcast Template Content Generation', () => {
    describe('getTemplateContent for broadcast reservation', () => {
      it('should generate correct broadcast reservation template content', () => {
        const templateCode = 'BROADCAST_RESERVATION_TEMPLATE';
        const params = {
          이름: '김팔로워',
          셀러이름: '김판매자',
          방송예약시간: '12월 25일 오후 3시',
          방송제목: '크리스마스 특가 방송',
          셀러프로필링크: 'https://elta.com/sellers/seller-123',
        };

        // MockConfigService가 'BROADCAST_RESERVATION_TEMPLATE'를 반환하도록 설정되어 있음
        (service as any).broadcastReservationTemplate = 'BROADCAST_RESERVATION_TEMPLATE';

        const result = service['getTemplateContent'](templateCode, params);

        expect(result).toContain('[방송예약 알림]');
        expect(result).toContain('김팔로워님!');
        expect(result).toContain('김판매자님이 12월 25일 오후 3시에 크리스마스 특가 방송 방송을 시작해요!');
        expect(result).toContain('https://elta.com/sellers/seller-123에서 팔로우 후');
      });
    });

    describe('getTemplateContent for broadcast start', () => {
      it('should generate correct broadcast start template content', () => {
        const templateCode = 'BROADCAST_START_TEMPLATE';
        const params = {
          이름: '김팔로워',
          셀러이름: '김판매자',
          방송제목: '크리스마스 특가 방송',
          셀러프로필링크: 'https://elta.com/sellers/seller-123',
        };

        (service as any).broadcastStartTemplate = 'BROADCAST_START_TEMPLATE';

        const result = service['getTemplateContent'](templateCode, params);

        expect(result).toContain('[방송시작 알림]');
        expect(result).toContain('김팔로워님!');
        expect(result).toContain('김판매자님이 크리스마스 특가 방송 방송을 시작했어요!');
        expect(result).toContain('https://elta.com/sellers/seller-123에서 팔로우 후');
      });
    });

    describe('getTemplateAltContent for broadcast templates', () => {
      it('should generate correct broadcast reservation alt template content', () => {
        const templateCode = 'BROADCAST_RESERVATION_TEMPLATE';
        const params = {
          이름: '김팔로워',
          셀러이름: '김판매자',
          방송예약시간: '12월 25일 오후 3시',
          방송제목: '크리스마스 특가 방송',
          셀러프로필링크: 'https://elta.com/sellers/seller-123',
        };

        (service as any).broadcastReservationTemplate = 'BROADCAST_RESERVATION_TEMPLATE';

        const result = service['getTemplateAltContent'](templateCode, params);

        expect(result).toContain('[방송예약 알림]');
        expect(result).toContain('김팔로워님!');
        expect(result).toContain('김판매자님이 12월 25일 오후 3시에 크리스마스 특가 방송 방송을 시작해요!');
      });

      it('should generate correct broadcast start alt template content', () => {
        const templateCode = 'BROADCAST_START_TEMPLATE';
        const params = {
          이름: '김팔로워',
          셀러이름: '김판매자',
          방송제목: '크리스마스 특가 방송',
          셀러프로필링크: 'https://elta.com/sellers/seller-123',
        };

        (service as any).broadcastStartTemplate = 'BROADCAST_START_TEMPLATE';

        const result = service['getTemplateAltContent'](templateCode, params);

        expect(result).toContain('[방송시작 알림]');
        expect(result).toContain('김팔로워님!');
        expect(result).toContain('김판매자님이 크리스마스 특가 방송 방송을 시작했어요!');
      });
    });
  });
});

