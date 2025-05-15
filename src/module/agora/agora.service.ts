// src/agora/agora.service.ts
//--------------------------------------------------------------
//  AgoraService (Nest Provider)
//
//  • Generates Interactive Live Streaming (RTC) tokens
//    – publisher / subscriber role
//  • Generates Chat SDK tokens
//  • Wraps agora-token **v2.x** API (AccessToken2, 7-arg builder)
//  • Throws friendly 5xx errors when token generation fails
//
//  DEPENDS ON .env:
//    AGORA_APP_ID=<your_app_id>
//    AGORA_APP_CERTIFICATE=<primary_certificate>
//
//--------------------------------------------------------------

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, ChatTokenBuilder, RtcRole } from 'agora-token'; // v2.x

@Injectable()
export class AgoraService {
  /** Agora 콘솔에서 받은 App ID / Primary Certificate */
  private readonly appId: string;
  private readonly cert: string;

  constructor(private readonly cfg: ConfigService) {
    this.appId = this.cfg.get<string>('AGORA_APP_ID') ?? '';
    this.cert = this.cfg.get<string>('AGORA_APP_CERTIFICATE') ?? '';

    if (!this.appId || !this.cert) {
      throw new Error('AGORA_APP_ID 또는 AGORA_APP_CERTIFICATE 환경 변수가 비어 있습니다.');
    }
  }

  /**
   * RTC(Interactive Live Streaming) 토큰 생성
   *
   * @param channel  채널 ID (string)
   * @param uid      Agora UID (number)
   * @param role     'publisher' | 'subscriber'
   * @param ttl      만료(초) 기본 1h
   */
  rtcToken(channel: string, uid: number, role: 'publisher' | 'subscriber', ttl = 60 * 60): string {
    const expire = Math.floor(Date.now() / 1000) + ttl;

    try {
      return RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.cert,
        channel,
        uid,
        role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
        expire, // tokenExpire
        expire, // privilegeExpire – 같은 값으로 통일
      );
    } catch (err) {
      throw new InternalServerErrorException('RTC 토큰 생성 실패', { cause: err });
    }
  }

  /**
   * Chat SDK 토큰 생성
   *
   * @param uid   사용자 ID (string)
   * @param ttl   만료(초) 기본 1h
   */
  chatToken(uid: string, ttl = 60 * 60): string {
    const expire = Math.floor(Date.now() / 1000) + ttl;

    try {
      return ChatTokenBuilder.buildUserToken(this.appId, this.cert, uid, expire);
    } catch (err) {
      throw new InternalServerErrorException('Chat 토큰 생성 실패', { cause: err });
    }
  }

  /**
   * RTM 토큰이 필요하다면 아래 메서드도 활성화
   */
  // rtmToken(uid: string, ttl = 60 * 60): string {
  //   const expire = Math.floor(Date.now() / 1000) + ttl;
  //   return RtmTokenBuilder.buildToken(
  //     this.appId,
  //     this.cert,
  //     uid,
  //     expire,
  //   );
  // }
}
