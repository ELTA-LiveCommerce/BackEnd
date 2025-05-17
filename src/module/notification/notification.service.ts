import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SolapiMessageService } from 'solapi';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly solapiApiKey: string;
  private readonly solapiApiSecret: string;
  private readonly solapiPfId: string; // 카카오톡 비즈니스 채널 발신 프로필 ID
  private readonly isProduction: boolean;
  private readonly messageService: SolapiMessageService;

  constructor(private readonly configService: ConfigService) {
    this.solapiApiKey = this.configService.get<string>('SOLAPI_API_KEY', '');
    this.solapiApiSecret = this.configService.get<string>('SOLAPI_API_SECRET', '');
    this.solapiPfId = this.configService.get<string>('SOLAPI_PFID', '');
    this.isProduction = this.configService.get<string>('NODE_ENV', 'development') === 'production';

    // 솔라피 메시지 서비스 초기화
    this.messageService = new SolapiMessageService(this.solapiApiKey, this.solapiApiSecret);
  }

  /**
   * 카카오 알림톡을 전송합니다.
   * @param templateCode 알림톡 템플릿 코드
   * @param recipientPhoneNumber 수신자 전화번호
   * @param params 템플릿에 삽입할 파라미터
   */
  async sendKakaoTalk(templateCode: string, recipientPhoneNumber: string, params: Record<string, any>): Promise<void> {
    this.logger.log(
      `Sending KakaoTalk to ${recipientPhoneNumber} with template ${templateCode} and params ${JSON.stringify(params)}`,
    );

    // 개발 환경에서는 실제로 API를 호출하지 않고 로그만 출력
    if (!this.isProduction) {
      this.logger.log('Development mode: Not sending actual KakaoTalk message');
      return Promise.resolve();
    }

    try {
      // Solapi SDK를 사용한 알림톡 발송
      const message = {
        to: this.formatPhoneNumber(recipientPhoneNumber),
        from: this.configService.get<string>('SOLAPI_SENDER_NUMBER', ''),
        kakaoOptions: {
          pfId: this.solapiPfId,
          templateId: templateCode,
          variables: this.convertParamsToVariables(params),
          disableSms: false, // 알림톡 실패 시 SMS로 대체 발송
        },
      };

      const result = await this.messageService.send(message);
      this.logger.log(`KakaoTalk sent successfully: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`Error sending KakaoTalk: ${error.message}`, error.stack);
      // 에러를 던지지 않고 내부적으로 처리
    }
  }

  /**
   * 템플릿 파라미터를 솔라피 variables 형식으로 변환합니다.
   * 모든 값은 문자열로 변환되어야 합니다.
   */
  private convertParamsToVariables(params: Record<string, any>): Record<string, string> {
    const variables: Record<string, string> = {};

    for (const key in params) {
      // 템플릿에서 사용하는 #{key} 형식의 변수명으로 변환
      const variableName = `#{${key}}`;

      // 값이 객체인 경우 JSON 문자열로 변환
      if (typeof params[key] === 'object' && params[key] !== null) {
        variables[variableName] = JSON.stringify(params[key]);
      } else {
        // 그 외 타입은 문자열로 변환
        variables[variableName] = String(params[key]);
      }
    }

    return variables;
  }

  /**
   * 전화번호 형식을 표준화합니다 (예: 01012345678 형식으로 변환)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // 하이픈(-) 제거
    return phoneNumber.replace(/-/g, '');
  }
}

