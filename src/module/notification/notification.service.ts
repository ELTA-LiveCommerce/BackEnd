import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 팝빌 SDK import
import * as popbill from 'popbill';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly linkId: string;
  private readonly secretKey: string;
  private readonly testCorpNum: string;
  private readonly userId: string;
  private readonly isTest: boolean;
  private readonly senderNumber: string;
  private readonly isProduction: boolean;
  private readonly kakaoService: any;

  constructor(private readonly configService: ConfigService) {
    this.linkId = this.configService.get<string>('POPBILL_LINK_ID', '');
    this.secretKey = this.configService.get<string>('POPBILL_SECRET_KEY', '');
    this.testCorpNum = this.configService.get<string>('POPBILL_TEST_CORP_NUM', '');
    this.userId = this.configService.get<string>('POPBILL_USER_ID', '');
    this.isTest = this.configService.get<string>('POPBILL_IS_TEST', 'true') === 'true';
    this.senderNumber = this.configService.get<string>('POPBILL_SENDER_NUMBER', '');
    this.isProduction = this.configService.get<string>('NODE_ENV', 'development') === 'production';

    // 팝빌 SDK 설정
    popbill.config({
      LinkID: this.linkId,
      SecretKey: this.secretKey,
      IsTest: this.isTest,
      IPRestrictOnOff: true,
      UseStaticIP: false,
      UseLocalTimeYN: true,
      defaultErrorHandler: (error: any) => {
        this.logger.error(`Popbill Error: [${error.code}] ${error.message}`);
      },
    });

    // 카카오톡 서비스 객체 초기화
    this.kakaoService = popbill.KakaoService();
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
      // 알림톡 내용 생성 (템플릿 변수 치환)
      const content = this.replaceTemplateVariables(params);

      // 대체문자 내용
      const altContent = '알림톡 대체 문자';

      // 대체문자 유형 [공백-미전송, C-알림톡내용, A-대체문자내용]
      const altSendType = 'C';

      // 예약일시 (빈 문자열은 즉시 전송)
      const sndDT = '';

      // 수신자 정보
      const receiver = this.formatPhoneNumber(recipientPhoneNumber);
      const receiverName = 'customer';

      // 요청번호 (고유한 번호 생성)
      const requestNum = this.generateRequestNum();

      // 알림톡 버튼 정보 (템플릿 신청 시 기재한 버튼 정보와 동일하게 전송하는 경우 null)
      const btns = null;

      // 팝빌 카카오 알림톡 전송
      const receiptNum = await new Promise((resolve, reject) => {
        this.kakaoService.sendATS_one(
          this.testCorpNum,
          templateCode,
          this.senderNumber,
          content,
          altContent,
          altSendType,
          sndDT,
          receiver,
          receiverName,
          this.userId,
          requestNum,
          btns,
          (receiptNum: string) => {
            resolve(receiptNum);
          },
          (error: any) => {
            reject(error);
          },
        );
      });

      this.logger.log(`KakaoTalk sent successfully: ${JSON.stringify(receiptNum)}`);
    } catch (error) {
      this.logger.error(`Error sending KakaoTalk: ${error.message}`, error.stack);
      // 에러를 던지지 않고 내부적으로 처리
    }
  }

  /**
   * 템플릿 변수를 실제 값으로 치환합니다.
   * 이 함수는 실제 템플릿에 맞게 수정이 필요합니다.
   */
  private replaceTemplateVariables(params: Record<string, any>): string {
    // 예시 템플릿 내용 - 실제 승인된 템플릿 내용으로 변경 필요
    let content = '안녕하세요. ELTA입니다.\n';

    if (params.orderNumber) {
      content += `주문번호: ${params.orderNumber}\n`;
    }

    if (params.totalAmount) {
      content += `주문금액: ${params.totalAmount}원\n`;
    }

    if (params.productNames) {
      content += `상품명: ${params.productNames}\n`;
    }

    if (params.buyerName) {
      content += `구매자: ${params.buyerName}\n`;
    }

    if (params.orderDate) {
      content += `주문일시: ${params.orderDate}\n`;
    }

    content += '\n감사합니다.';

    return content;
  }

  /**
   * 전화번호 형식을 표준화합니다 (예: 01012345678 형식으로 변환)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // 하이픈(-) 제거
    return phoneNumber.replace(/-/g, '');
  }

  /**
   * 고유한 요청번호를 생성합니다.
   */
  private generateRequestNum(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `REQ-${timestamp}-${random}`;
  }
}

