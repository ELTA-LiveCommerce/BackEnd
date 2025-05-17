import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { SolapiMessageService } from 'solapi';

// Solapi SDK 모킹
jest.mock('solapi', () => {
  return {
    SolapiMessageService: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockResolvedValue({ result: 'success' }),
      };
    }),
  };
});

describe('NotificationService', () => {
  let service: NotificationService;
  let configService: ConfigService;
  let mockSolapiService: jest.Mocked<SolapiMessageService>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => {
      if (key === 'SOLAPI_API_KEY') return 'test-api-key';
      if (key === 'SOLAPI_API_SECRET') return 'test-api-secret';
      if (key === 'SOLAPI_PFID') return 'test-sender-id';
      if (key === 'SOLAPI_SENDER_NUMBER') return '01099998888';
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

    // 서비스 내부의 messageService에 접근하여 참조 저장
    mockSolapiService = service['messageService'] as jest.Mocked<SolapiMessageService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendKakaoTalk', () => {
    it('should log message in development environment without API call', async () => {
      // Spy on logger.log
      const logSpy = jest.spyOn(service['logger'], 'log');

      // Execute the method
      await service.sendKakaoTalk('TEST_TEMPLATE', '010-1234-5678', { key: 'value' });

      // Verify Logger was called with expected messages
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending KakaoTalk to 010-1234-5678 with template TEST_TEMPLATE'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Development mode: Not sending actual KakaoTalk message'),
      );

      // Verify API was not called
      expect(mockSolapiService.send).not.toHaveBeenCalled();
    });

    it('should call Solapi API in production environment', async () => {
      // 먼저 새로운 모킹된 ConfigService를 만들어 NODE_ENV가 production인 환경을 시뮬레이션
      const mockProdConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'SOLAPI_API_KEY') return 'test-api-key';
          if (key === 'SOLAPI_API_SECRET') return 'test-api-secret';
          if (key === 'SOLAPI_PFID') return 'test-sender-id';
          if (key === 'SOLAPI_SENDER_NUMBER') return '01099998888';
          return '';
        }),
      };

      // 새로운 서비스 인스턴스 생성
      const prodService = new NotificationService(mockProdConfigService as unknown as ConfigService);
      const mockProdSolapiService = prodService['messageService'] as jest.Mocked<SolapiMessageService>;

      // Mock send success response
      mockProdSolapiService.send = jest.fn().mockResolvedValue({ result: 'success' });

      // 새 서비스 인스턴스로 메서드 실행
      await prodService.sendKakaoTalk('ORDER_COMPLETE_TEMPLATE', '010-1234-5678', {
        orderNumber: 'ORD-123',
        totalAmount: '50,000',
        orderDate: '2023-06-01 14:30:00',
      });

      // Verify API was called with correct parameters
      expect(mockProdSolapiService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '01012345678', // 하이픈 제거됨
          from: '01099998888',
          kakaoOptions: expect.objectContaining({
            pfId: 'test-sender-id',
            templateId: 'ORDER_COMPLETE_TEMPLATE',
            variables: expect.objectContaining({
              '#{orderNumber}': 'ORD-123',
              '#{totalAmount}': '50,000',
              '#{orderDate}': '2023-06-01 14:30:00',
            }),
            disableSms: false,
          }),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      // 새로운 모킹된 ConfigService를 만들어 NODE_ENV가 production인 환경을 시뮬레이션
      const mockProdConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'SOLAPI_API_KEY') return 'test-api-key';
          if (key === 'SOLAPI_API_SECRET') return 'test-api-secret';
          if (key === 'SOLAPI_PFID') return 'test-sender-id';
          if (key === 'SOLAPI_SENDER_NUMBER') return '01099998888';
          return '';
        }),
      };

      // 새로운 서비스 인스턴스 생성
      const prodService = new NotificationService(mockProdConfigService as unknown as ConfigService);
      const mockProdSolapiService = prodService['messageService'] as jest.Mocked<SolapiMessageService>;

      // Mock send error
      const error = new Error('API Error');
      mockProdSolapiService.send = jest.fn().mockRejectedValue(error);

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

  describe('convertParamsToVariables', () => {
    it('should convert params to variables with #{key} format', () => {
      const params = {
        orderNumber: 'ORD-123',
        totalAmount: 50000,
        orderDate: '2023-06-01 14:30:00',
      };

      const result = service['convertParamsToVariables'](params);

      expect(result).toEqual({
        '#{orderNumber}': 'ORD-123',
        '#{totalAmount}': '50000',
        '#{orderDate}': '2023-06-01 14:30:00',
      });
    });

    it('should handle object values by converting them to JSON strings', () => {
      const params = {
        message: { key: 'value', nested: { data: true } },
      };

      const result = service['convertParamsToVariables'](params);

      expect(result).toEqual({
        '#{message}': '{"key":"value","nested":{"data":true}}',
      });
    });

    it('should convert non-string values to strings', () => {
      const params = {
        number: 123,
        boolean: true,
        nullValue: null,
      };

      const result = service['convertParamsToVariables'](params);

      expect(result).toEqual({
        '#{number}': '123',
        '#{boolean}': 'true',
        '#{nullValue}': 'null',
      });
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

