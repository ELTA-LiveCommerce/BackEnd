/*───────────────────────────────────────────────────────────────
  src/agora/agora.service.ts
────────────────────────────────────────────────────────────────*/
import axios, { AxiosInstance } from 'axios';
import { RtcTokenBuilder, ChatTokenBuilder, RtcRole } from 'agora-token';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgoraService {
  /* ───── .env 로부터 읽어온 값 ───── */
  private readonly appId: string;
  private readonly cert: string;

  private readonly chatKey: string;        // org#app
  private readonly chatBase: string;       // https://a61.chat.agora.io
  private readonly chatOrg: string;
  private readonly chatApp: string;

  /* ───── 캐시 ───── */
  private rest!: AxiosInstance;
  private appToken = '';
  private appTokenExp = 0;

  private readonly log = new Logger(AgoraService.name);

  constructor(cfg: ConfigService) {
    this.appId    = cfg.getOrThrow('AGORA_APP_ID');
    this.cert     = cfg.getOrThrow('AGORA_APP_CERTIFICATE');
    this.chatKey  = cfg.getOrThrow('AGORA_CHAT_APP_KEY');
    this.chatBase = cfg.getOrThrow('AGORA_CHAT_DC_BASE');

    const [org, app] = this.chatKey.split('#');
    this.chatOrg = org;
    this.chatApp = app;

    this.log.log(
      `[Init] Chat org=${this.chatOrg} app=${this.chatApp} ` +
      `AppID=${this.appId.slice(0, 6)}… Cert=${this.cert.slice(0, 6)}…`,
    );
  }

  /* ───── RTC TOKEN ───── */

  rtcToken(channel: string, uid: number, role: 'publisher' | 'subscriber', ttl = 3600) {
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

  rtcTokenWithAccount(channel: string, account: string, role: 'publisher' | 'subscriber', ttl = 3600) {
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

  /* ───── CHAT USER TOKEN ───── */

  chatUserToken(uid: string, ttl = 3600) {
    const exp = this.now() + ttl;
    return ChatTokenBuilder.buildUserToken(this.appId, this.cert, uid, exp);
  }

  /* ───── Chat **App-Token** (OAuth) ───── */

  private async appTokenHeader() {
    if (Date.now() < this.appTokenExp - 10 * 60 * 1000 && this.appToken) {
      return { Authorization: `Bearer ${this.appToken}` };
    }

    const ttl  = 7 * 24 * 60 * 60;            // 7 days
    const expS = this.now() + ttl;
    this.appToken = ChatTokenBuilder.buildAppToken(this.appId, this.cert, expS);
    this.appTokenExp = Date.now() + ttl * 1000;

    this.rest = axios.create({
      baseURL: `${this.chatBase}/edu/apps/${this.chatOrg}/${this.chatApp}`,
      headers: { Authorization: `Bearer ${this.appToken}` },
    });

    this.log.log('[Token] new App-Token generated');
    this.log.log(`[Token] App-Token: ${this.appToken}`);
    return { Authorization: `Bearer ${this.appToken}` };
  }

  /* ───── 내부 util: 필요한 경우 Chat-User 자동 생성 ───── */

  private async ensureChatUser(uid: string) {
    await this.appTokenHeader();

    try {
      await this.rest.get(`/users/${uid}`);      // 이미 있으면 200
      return;
    } catch (e: any) {
      if (e?.response?.status !== 404) throw e;  // 다른 오류면 그대로 던짐
    }

    /* 404 → 새로 생성 */
    this.log.log(`[REST] create Chat-User ${uid}`);
    await this.rest.post('/users', {
      username: uid,
      password: 'nopass',       // 필수 필드, 아무 값이나
    });
  }

  /* ───── CHAT REST Helper ───── */

  /** 방송 시작: 방(owner) 생성 */
  async createGroup(groupId: string, ownerUid: string) {
    await this.ensureChatUser(ownerUid);

    await this.appTokenHeader();
    return this.rest.post('/chatgroups', {
      groupid   : groupId,
      groupname : `live_${groupId}`,
      desc      : '라이브 채팅',
      public    : false,
      approval  : true,
      maxusers  : 5000,
      owner     : ownerUid,
    });
  }

  /** 시청자 입장 */
  async addUser(groupId: string, uid: string) {
    await this.ensureChatUser(uid);

    await this.appTokenHeader();
    return this.rest.post(`/chatgroups/${groupId}/users/${uid}`);
  }

  async removeUser(groupId: string, uid: string) {
    await this.appTokenHeader();
    return this.rest.delete(`/chatgroups/${groupId}/users/${uid}`);
  }

  async deleteGroup(groupId: string) {
    await this.appTokenHeader();
    return this.rest.delete(`/chatgroups/${groupId}`);
  }

  async sendSystemMessage(groupId: string, text: string) {
    await this.appTokenHeader();
    return this.rest.post(`/chatgroups/${groupId}/messages`, {
      type: 'txt',
      msg : text,
    });
  }

  /* util */
  private now() { return Math.floor(Date.now() / 1000); }
}
