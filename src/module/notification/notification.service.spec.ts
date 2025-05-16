import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import axios from 'axios';

jest.mock('axios');

describe('NotificationService', () => {
  let service: NotificationService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => {
      if (key === 'KAKAO_API_KEY') return 'test-api-key';
      if (key === 'KAKAO_SENDER_ID') return 'test-sender-id';
      if (key === 'KAKAO_API_URL') return 'https://test-api-url.com';
      if (key === 'NODE_ENV') return 'development';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendKakaoTalk', () => {
    it('should log message in development environment without API call', async () => {
      // Spy on logger.log
      const logSpy = jest.spyOn(service['logger'], 'log');

      // Execute the method
      await service.sendKakaoTalk('TEST_TEMPLATE', '01012345678', { key: 'value' });

      // Verify Logger was called with expected messages
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending KakaoTalk to 01012345678 with template TEST_TEMPLATE'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Development mode: Not sending actual KakaoTalk message'),
      );

      // Verify API was not called
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should call Kakao API in production environment', async () => {
      // 먼저 새로운 모킹된 ConfigService를 만들어 NODE_ENV가 production인 환경을 시뮬레이션
      const mockProdConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'KAKAO_API_KEY') return 'test-api-key';
          if (key === 'KAKAO_SENDER_ID') return 'test-sender-id';
          if (key === 'KAKAO_API_URL') return 'https://test-api-url.com';
          return '';
        }),
      };

      // 새로운 서비스 인스턴스 생성
      const prodService = new NotificationService(mockProdConfigService as unknown as ConfigService);

      // Mock axios.post success response
      (axios.post as jest.Mock).mockResolvedValue({
        data: { result: 'success' },
      });

      // 새 서비스 인스턴스로 메서드 실행
      await prodService.sendKakaoTalk('ORDER_COMPLETE_TEMPLATE', '01012345678', {
        orderNumber: 'ORD-123',
        totalAmount: 50000,
      });

      // Verify API was called with correct parameters
      expect(axios.post).toHaveBeenCalledWith(
        'https://test-api-url.com/send',
        expect.objectContaining({
          senderKey: 'test-sender-id',
          recipientPhoneNumber: '01012345678',
          templateCode: 'ORDER_COMPLETE_TEMPLATE',
          message: expect.stringContaining('주문이 완료되었습니다'),
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      // 새로운 모킹된 ConfigService를 만들어 NODE_ENV가 production인 환경을 시뮬레이션
      const mockProdConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'KAKAO_API_KEY') return 'test-api-key';
          if (key === 'KAKAO_SENDER_ID') return 'test-sender-id';
          if (key === 'KAKAO_API_URL') return 'https://test-api-url.com';
          return '';
        }),
      };

      // 새로운 서비스 인스턴스 생성
      const prodService = new NotificationService(mockProdConfigService as unknown as ConfigService);

      // Mock axios.post error
      const error = new Error('API Error');
      (axios.post as jest.Mock).mockRejectedValue(error);

      // Spy on logger.error - 새 서비스 인스턴스의 logger에 spy 설정
      const errorSpy = jest.spyOn(prodService['logger'], 'error');

      // Execute the method - should not throw
      await prodService.sendKakaoTalk('ORDER_COMPLETE_TEMPLATE', '01012345678', {
        orderNumber: 'ORD-123',
        totalAmount: 50000,
      });

      // Verify logger.error was called
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error sending KakaoTalk'), expect.any(String));
    });
  });

  describe('buildMessageFromTemplate', () => {
    it('should build ORDER_COMPLETE_TEMPLATE message correctly', () => {
      const params = {
        orderNumber: 'ORD-123',
        totalAmount: 50000,
      };

      const result = service['buildMessageFromTemplate']('ORDER_COMPLETE_TEMPLATE', params);

      expect(result).toContain('주문이 완료되었습니다');
      expect(result).toContain('주문번호: ORD-123');
      expect(result).toContain('결제금액: 50,000원');
    });

    it('should build SELLER_ORDER_NOTIFICATION_TEMPLATE message correctly', () => {
      const params = {
        orderNumber: 'ORD-123',
        buyerName: '홍길동',
        productNames: '상품1 (2개), 상품2 (1개)',
        totalAmount: 50000,
        orderDate: '2023-06-01 14:30:00',
      };

      const result = service['buildMessageFromTemplate']('SELLER_ORDER_NOTIFICATION_TEMPLATE', params);

      expect(result).toContain('새로운 주문이 접수되었습니다');
      expect(result).toContain('주문번호: ORD-123');
      expect(result).toContain('구매자: 홍길동');
      expect(result).toContain('상품: 상품1 (2개), 상품2 (1개)');
      expect(result).toContain('금액: 50,000원');
      expect(result).toContain('주문일시: 2023-06-01 14:30:00');
    });

    it('should return default format for unknown template', () => {
      const params = { key: 'value' };

      const result = service['buildMessageFromTemplate']('UNKNOWN_TEMPLATE', params);

      expect(result).toContain('알림: {"key":"value"}');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should remove hyphens from phone number', () => {
      expect(service['formatPhoneNumber']('010-1234-5678')).toBe('01012345678');
      expect(service['formatPhoneNumber']('01012345678')).toBe('01012345678');
      expect(service['formatPhoneNumber']('010-1234-56-78')).toBe('01012345678');
    });
  });
});

