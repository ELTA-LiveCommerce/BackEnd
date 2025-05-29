import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 팝빌 SDK import
import * as popbill from 'popbill';

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface PaymentNotificationParams {
  customerName: string;
  productName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: string;
  dueDate: string;
  sellerPhoneNumber: string;
}

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
  private readonly depositAccountTemplate: string;

  constructor(private readonly configService: ConfigService) {
    this.linkId = this.configService.get<string>('POPBILL_LINK_ID', '');
    this.secretKey = this.configService.get<string>('POPBILL_SECRET_KEY', '');
    this.testCorpNum = this.configService.get<string>('POPBILL_TEST_CORP_NUM', '');
    this.userId = this.configService.get<string>('POPBILL_USER_ID', '');
    this.isTest = this.configService.get<boolean>('POPBILL_IS_TEST', true);
    this.senderNumber = this.configService.get<string>('POPBILL_SENDER_NUMBER', '');
    this.isProduction = this.configService.get<string>('NODE_ENV', 'development') === 'production';
    this.depositAccountTemplate = this.configService.get<string>('POPBILL_DEPOSIT_TEMPLATE_CODE', '025050000987');

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
   * 입금계좌 안내 알림톡을 발송합니다.
   * @param recipientPhoneNumber 수신자 전화번호
   * @param params 입금 안내 파라미터
   */
  async sendDepositAccountNotification(recipientPhoneNumber: string, params: PaymentNotificationParams): Promise<void> {
    this.logger.log(`Sending deposit account notification to ${recipientPhoneNumber} for ${params.productName}`);

    // 템플릿 변수 치환
    const templateParams = {
      이름: params.customerName,
      상품명: params.productName,
      계좌은행: params.bankName,
      계좌번호: params.accountNumber,
      계좌주: params.accountHolder,
      금액: params.amount,
      입금마감날짜: params.dueDate,
      셀러전화번호: params.sellerPhoneNumber,
    };

    await this.sendKakaoTalkWithTemplate(this.depositAccountTemplate, recipientPhoneNumber, templateParams);
  }

  /**
   * 카카오 알림톡을 전송합니다.
   * @param templateCode 알림톡 템플릿 코드
   * @param recipientPhoneNumber 수신자 전화번호
   * @param params 템플릿에 삽입할 파라미터
   */
  async sendKakaoTalk(templateCode: string, recipientPhoneNumber: string, params: Record<string, any>): Promise<void> {
    await this.sendKakaoTalkWithTemplate(templateCode, recipientPhoneNumber, params);
  }

  /**
   * 실제 카카오 알림톡 발송 로직
   */
  private async sendKakaoTalkWithTemplate(
    templateCode: string,
    recipientPhoneNumber: string,
    params: Record<string, any>,
  ): Promise<void> {
    this.logger.log(
      `Sending KakaoTalk to ${recipientPhoneNumber} with template ${templateCode} and params ${JSON.stringify(params)}`,
    );

    try {
      // 알림톡 내용 생성 (템플릿 변수 치환)
      const content = this.getTemplateContent(templateCode, params);

      // 대체문자 내용
      const altContent = this.getTemplateAltContent(templateCode, params);

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
      Logger.debug(this.testCorpNum);
      Logger.debug(templateCode);
      Logger.debug(this.senderNumber);
      Logger.debug(content);
      Logger.debug(altContent);
      Logger.debug(altSendType);
      Logger.debug(sndDT);
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
   */
  private getTemplateContent(templateCode: string, params: Record<string, any>): string {
    // 입금계좌 알림 템플릿 (025050000987)
    if (templateCode === this.depositAccountTemplate) {
      return `[입금계좌 알림]

#{이름}님!
주문하신 #{상품명}에 대한 입금 
계좌를 안내드립니다.
#{계좌은행} #{계좌번호} 
#{계좌주}로 #{금액}을 
#{입금마감날짜}까지 무통장입금 
결제를 해주세요.
입금이 확인되면 다시 안내해드릴게요!
판매자 상담은 #{셀러전화번호}으로 해주세요.`
        .replace(/#{이름}/g, params.이름 || '')
        .replace(/#{상품명}/g, params.상품명 || '')
        .replace(/#{계좌은행}/g, params.계좌은행 || '')
        .replace(/#{계좌번호}/g, params.계좌번호 || '')
        .replace(/#{계좌주}/g, params.계좌주 || '')
        .replace(/#{금액}/g, params.금액 || '')
        .replace(/#{입금마감날짜}/g, params.입금마감날짜 || '')
        .replace(/#{셀러전화번호}/g, params.셀러전화번호 || '');
    }
    throw new NotImplementedException('Not implemented');
  }

  private getTemplateAltContent(templateCode: string, params: Record<string, any>): string {
    // 입금계좌 알림 템플릿 (025050000987)
    if (templateCode === this.depositAccountTemplate) {
      return `[입금계좌 알림]

#{이름}님!
주문하신 #{상품명}에 대한 입금 
계좌를 안내드립니다.
#{계좌은행} #{계좌번호} 
#{계좌주}로 #{금액}을 
#{입금마감날짜}까지 무통장입금 
결제를 해주세요.
입금이 확인되면 다시 안내해드릴게요!
판매자 상담은 #{셀러전화번호}으로 해주세요.`
        .replace(/#{이름}/g, params.이름 || '')
        .replace(/#{상품명}/g, params.상품명 || '')
        .replace(/#{계좌은행}/g, params.계좌은행 || '')
        .replace(/#{계좌번호}/g, params.계좌번호 || '')
        .replace(/#{계좌주}/g, params.계좌주 || '')
        .replace(/#{금액}/g, params.금액 || '')
        .replace(/#{입금마감날짜}/g, params.입금마감날짜 || '')
        .replace(/#{셀러전화번호}/g, params.셀러전화번호 || '');
    }
    throw new NotImplementedException('Not implemented');
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

