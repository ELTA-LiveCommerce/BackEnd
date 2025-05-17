/*───────────────────────────────────────────────────────────────
  src/agora/agora.service.ts
  --------------------------------------------------------------
  NestJS Provider that wraps Agora-Token v2.x + Chat REST

  ▸ RTC 토큰 (UID · UserAccount)
  ▸ Chat User-Token
  ▸ Chat App-Token 자동 갱신(7 d 캐시)  ➜ 모든 Chat-REST 호출에 사용
  ▸ 채팅 그룹 생성 / 멤버 초대·강퇴 / 그룹 삭제 / 시스템 메시지

  .env 예시
  ───────────────────────────────────────────────────────────────
    AGORA_APP_ID=8dbc0a146d9a455f8f116f2caa5ca25b
    AGORA_APP_CERT=73c0b4a8e6b84e2698b2d48bd8938c2d

    AGORA_CHAT_APP_KEY=611335853#1539479      # org#app
    AGORA_CHAT_DC_BASE=https://a61.chat.agora.io
────────────────────────────────────────────────────────────────*/

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { RtcTokenBuilder, ChatTokenBuilder, RtcRole } from 'agora-token';
import axios from 'axios';
import type { AxiosInstance } from 'axios';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgoraService {
  /* ─── constructor 에서 안전하게 주입 값 할당 ─── */
  private readonly appId: string;
  private readonly cert: string;

  private readonly chatKey: string;
  private readonly chatBase: string;

  /* 채팅 App-Token 캐시 */
  private rest!: AxiosInstance;
  private appToken = '';
  private appTokenExp = 0;

  private readonly log = new Logger(AgoraService.name);

  constructor(private readonly cfg: ConfigService) {
    this.appId = cfg.getOrThrow<string>('AGORA_APP_ID');
    this.cert = cfg.getOrThrow<string>('AGORA_APP_CERT');

    this.chatKey = cfg.getOrThrow<string>('AGORA_CHAT_APP_KEY');
    this.chatBase = cfg.getOrThrow<string>('AGORA_CHAT_DC_BASE');
  }

  /* ─────────────── RTC TOKEN ─────────────── */

  rtcToken(channel: string, uid: number, role: 'publisher' | 'subscriber', ttl = 3600): string {
    const exp = this.now() + ttl;
    return RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.cert,
      channel,
      uid,
      role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      exp,
      exp,
    );
  }

  rtcTokenWithAccount(channel: string, account: string, role: 'publisher' | 'subscriber', ttl = 3600): string {
    const exp = this.now() + ttl;
    return RtcTokenBuilder.buildTokenWithUserAccount(
      this.appId,
      this.cert,
      channel,
      account,
      role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      exp,
      exp,
    );
  }

  /* ─────────────── CHAT USER TOKEN ─────────────── */

  chatUserToken(uid: string, ttl = 3600): string {
    const exp = this.now() + ttl;
    return ChatTokenBuilder.buildUserToken(this.appId, this.cert, uid, exp);
  }

  /* ─────────────── APP TOKEN (관리자) 자동 갱신 ─────────────── */

  private async appTokenHeader(): Promise<{ Authorization: string }> {
    if (Date.now() < this.appTokenExp - 10 * 60 * 1000 && this.appToken) {
      return { Authorization: `Bearer ${this.appToken}` };
    }

    const ttl = 7 * 24 * 60 * 60; // 7일
    const expS = this.now() + ttl;

    try {
      this.appToken = ChatTokenBuilder.buildAppToken(this.appId, this.cert, expS);
    } catch (e) {
      throw new InternalServerErrorException('Chat App-Token 생성 실패', { cause: e });
    }
    this.appTokenExp = Date.now() + ttl * 1000;

    /* Axios 인스턴스 재생성 */
    this.rest = axios.create({
      baseURL: `${this.chatBase}/edu/apps/${this.chatKey}`,
      headers: { Authorization: `Bearer ${this.appToken}` },
    });
    this.log.log('Chat App-Token refreshed');
    return { Authorization: `Bearer ${this.appToken}` };
  }

  /* ─────────────── CHAT REST HELPER ─────────────── */

  async createGroup(groupId: string, ownerUid: string) {
    await this.appTokenHeader();
    return this.rest.post('/chatgroups', {
      groupid: groupId,
      groupname: `live_${groupId}`,
      desc: '라이브 채팅',
      public: false,
      approval: true,
      maxusers: 5000,
      owner: ownerUid,
    });
  }

  async addUser(groupId: string, uid: string) {
    await this.appTokenHeader();
    return this.rest.post(`/chatgroups/${groupId}/users/${uid}`);
  }

  async removeUser(groupId: string, uid: string) {
    await this.appTokenHeader();
    return this.rest.delete(`/chatgroups/${groupId}/users/${uid}`);
  }

  async deleteGroup(groupId: string) {
    try {
      await this.appTokenHeader();
      await this.rest.delete(`/chatgroups/${groupId}`);
    } catch (e) {
      this.log.warn(`deleteGroup ${groupId} 실패(무시): ${e}`);
    }
  }

  async sendSystemMessage(groupId: string, text: string) {
    await this.appTokenHeader();
    return this.rest.post(`/chatgroups/${groupId}/messages`, {
      type: 'txt',
      msg: text,
    });
  }

  /* ─────────────── utils ─────────────── */
  private now() {
    return Math.floor(Date.now() / 1000);
  }
}
