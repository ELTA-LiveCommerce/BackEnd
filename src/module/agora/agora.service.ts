/*───────────────────────────────────────────────────────────────
  src/agora/agora.service.ts
────────────────────────────────────────────────────────────────*/
import axios, { AxiosInstance } from 'axios';
import { RtcTokenBuilder, ChatTokenBuilder, RtcRole } from 'agora-token';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgoraService {
  /* ───── .env 로부터 읽어온 값 ───── */
  private readonly appId: string;
  private readonly cert: string;

  private readonly chatKey: string; // org#app
  private readonly chatBase: string; // https://a61.chat.agora.io
  private readonly chatOrg: string;
  private readonly chatApp: string;

  /* ───── 캐시 ───── */
  private rest!: AxiosInstance;
  private appToken = '';
  private appTokenExp = 0;

  private readonly log = new Logger(AgoraService.name);

  constructor(cfg: ConfigService) {
    this.appId = cfg.getOrThrow('AGORA_APP_ID');
    this.cert = cfg.getOrThrow('AGORA_APP_CERTIFICATE');
    this.chatKey = cfg.getOrThrow('AGORA_CHAT_APP_KEY');
    this.chatBase = cfg.getOrThrow('AGORA_CHAT_DC_BASE');

    const [org, app] = this.chatKey.split('#');
    this.chatOrg = org;
    this.chatApp = app;
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

    const ttl = 7 * 24 * 60 * 60; // 7 days
    const expS = this.now() + ttl;
    this.appToken = ChatTokenBuilder.buildAppToken(this.appId, this.cert, expS);
    this.appTokenExp = Date.now() + ttl * 1000;

    this.rest = axios.create({
      baseURL: `${this.chatBase}/${this.chatOrg}/${this.chatApp}`,
      headers: { Authorization: `Bearer ${this.appToken}` },
    });

    return { Authorization: `Bearer ${this.appToken}` };
  }

  /* ───── 내부 util: 필요한 경우 Chat-User 자동 생성 ───── */

  private async ensureChatUser(uid: string) {
    await this.appTokenHeader();

    const uidChat = uid.replace(/-/g, '_');

    try {
      await this.rest.get(`/users/${uidChat}`); // 이미 있으면 200
      return;
    } catch (e: any) {
      if (e?.response?.status !== 404) throw e; // 다른 오류면 그대로 던짐
    }

    /* 404 → 새로 생성 */
    this.log.log(`[REST] create Chat-User ${uid}`);
    await this.rest.post('/users', {
      username: uidChat,
      password: 'nopass', // 필수 필드, 아무 값이나
    });
  }

  /* ───── CHAT REST Helper ───── */

  /** 방송 시작: 방(owner) 생성 */
  async createRoom(ownerUid: string, roomName: string) {
    await this.ensureChatUser(ownerUid);
    await this.appTokenHeader();

    const res = await this.rest.post('/chatrooms', {
      name: roomName, // roomname
      description: '라이브 채팅',
      maxusers: 5000,
      owner: ownerUid,
    });

    // 👉 생성된 roomId (문자열) 반환
    return res.data.data.id as string;
  }

  /** 시청자 입장 */
  async addUser(roomId: string, uid: string) {
    await this.ensureChatUser(uid);
    await this.appTokenHeader();
    return this.rest.post(`/chatrooms/${roomId}/users/${uid.replace(/-/g, '_')}`);
  }

  async removeUser(roomId: string, uid: string) {
    await this.appTokenHeader();
    return this.rest.delete(`/chatrooms/${roomId}/users/${uid.replace(/-/g, '_')}`);
  }

  async deleteRoom(roomId: string) {
    await this.appTokenHeader();
    return this.rest.delete(`/chatrooms/${roomId}`);
  }

  async sendSystemMessage(roomId: string, text: string) {
    await this.appTokenHeader();
    return this.rest.post(`/chatrooms/${roomId}/messages`, {
      type: 'txt',
      msg: text,
    });
  }

  /**
   * RTC 채널의 현재 사용자 수를 조회합니다 (Agora RESTful API 사용)
   * @param channelId RTC 채널 ID
   * @returns 현재 채널에 접속한 사용자 수
   */
  async getChannelUserCount(channelId: string): Promise<number> {
    try {
      // Agora RESTful API endpoint for channel user list
      const apiUrl = `https://api.agora.io/dev/v1/channel/user/${this.appId}/${channelId}`;

      // Basic Auth using Customer ID and Customer Secret
      const customerId = process.env.AGORA_CUSTOMER_ID;
      const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

      if (!customerId || !customerSecret) {
        this.log.warn('Agora RESTful API credentials not configured');
        return 0;
      }

      const auth = Buffer.from(`${customerId}:${customerSecret}`).toString('base64');

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      // API 응답에서 사용자 리스트 추출
      const userList = response.data?.data?.channel_exist ? response.data.data.users : [];

      this.log.log(`[RTC] Channel ${channelId} has ${userList.length} users`);
      return userList.length;
    } catch (error: any) {
      this.log.error(`Failed to get channel user count: ${error.message}`);

      // 채널이 존재하지 않거나 사용자가 없는 경우 0 반환
      if (error.response?.status === 404) {
        return 0;
      }

      throw error;
    }
  }

  /**
   * 채팅방의 현재 멤버 수를 조회합니다
   * @param roomId 채팅방 ID
   * @returns 현재 채팅방에 접속한 멤버 수
   */
  async getChatRoomMemberCount(roomId: string): Promise<number> {
    try {
      await this.appTokenHeader();

      const response = await this.rest.get(`/chatrooms/${roomId}`);
      const affiliationsCount = response.data?.data?.affiliations_count || 0;

      this.log.log(`[Chat] Room ${roomId} has ${affiliationsCount} members`);
      return affiliationsCount;
    } catch (error: any) {
      this.log.error(`Failed to get chat room member count: ${error.message}`);

      // 채팅방이 존재하지 않는 경우 0 반환
      if (error.response?.status === 404) {
        return 0;
      }

      return 0;
    }
  }

  /* util */
  private now() {
    return Math.floor(Date.now() / 1000);
  }
}

