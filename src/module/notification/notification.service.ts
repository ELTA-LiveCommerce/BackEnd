import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly kakaoApiKey: string;
  private readonly kakaoSenderId: string;
  private readonly kakaoApiUrl: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.kakaoApiKey = this.configService.get<string>('KAKAO_API_KEY', '');
    this.kakaoSenderId = this.configService.get<string>('KAKAO_SENDER_ID', '');
    this.kakaoApiUrl = this.configService.get<string>('KAKAO_API_URL', 'https://alimtalk-api.kakao.com/v2/sender');
    this.isProduction = this.configService.get<string>('NODE_ENV', 'development') === 'production';
  }

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
      // 카카오 알림톡 템플릿에 따른 메시지 구성
      const message = this.buildMessageFromTemplate(templateCode, params);

      // 카카오 알림톡 API 호출
      const response = await axios.post(
        `${this.kakaoApiUrl}/send`,
        {
          senderKey: this.kakaoSenderId,
          recipientPhoneNumber: this.formatPhoneNumber(recipientPhoneNumber),
          templateCode,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.kakaoApiKey}`,
          },
        },
      );

      this.logger.log(`KakaoTalk sent successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error(`Error sending KakaoTalk: ${error.message}`, error.stack);
      // 에러를 던지지 않고 내부적으로 처리
    }
  }

  /**
   * 템플릿 코드에 따라 메시지를 생성합니다.
   */
  private buildMessageFromTemplate(templateCode: string, params: Record<string, any>): string {
    switch (templateCode) {
      case 'ORDER_COMPLETE_TEMPLATE':
        return `주문이 완료되었습니다.
주문번호: ${params.orderNumber}
결제금액: ${params.totalAmount.toLocaleString()}원
주문일시: ${new Date().toLocaleString('ko-KR')}`;

      case 'SELLER_ORDER_NOTIFICATION_TEMPLATE':
        return `새로운 주문이 접수되었습니다.
주문번호: ${params.orderNumber}
구매자: ${params.buyerName}
상품: ${params.productNames}
금액: ${params.totalAmount.toLocaleString()}원
주문일시: ${params.orderDate}`;

      default:
        return `알림: ${JSON.stringify(params)}`;
    }
  }

  /**
   * 전화번호 형식을 표준화합니다 (예: 01012345678 형식으로 변환)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // 하이픈(-) 제거
    return phoneNumber.replace(/-/g, '');
  }
}

