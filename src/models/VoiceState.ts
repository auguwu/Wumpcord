/**
 * Copyright (c) 2020-2021 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* eslint-disable camelcase */

import type { GatewayVoiceState } from 'discord-api-types';
import type WebSocketClient from '../gateway/WebSocketClient';
import Base from './Base';

interface APIVoiceState extends GatewayVoiceState {
  request_to_speak_timestamp?: string;
}

interface RESTPatchAPIVoiceStateRequestToSpeak {
  request_to_speak_timestamp: string | null;
  channel_id: string | null;
}

interface RestPatchAPIVoiceStateInviteToSpeak extends RESTPatchAPIVoiceStateRequestToSpeak {
  suppress: boolean;
}

interface SelfVoiceState {
  stream?: boolean;
  video: boolean;
  deaf: boolean;
  mute: boolean;
}

interface ServerVoiceState {
  deaf: boolean;
  mute: boolean;
}

export class VoiceState extends Base<GatewayVoiceState> {
  public requestToSpeakDate?: Date | null;
  public channelID!: string | null;
  public sessionID!: string;
  public suppress!: boolean;
  public memberID!: string;
  public guildID?: string;
  public userID!: string;
  public server: ServerVoiceState;
  public self: SelfVoiceState;

  private client: WebSocketClient;

  constructor(client: WebSocketClient, data: APIVoiceState) {
    super();

    this.client = client;
    this.server = {
      deaf: false,
      mute: false
    };

    this.self = {
      stream: false,
      video: false,
      deaf: false,
      mute: false
    };

    this.patch(data);
  }

  patch(data: Partial<APIVoiceState>) {
    if (data.request_to_speak_timestamp !== undefined)
      this.requestToSpeakDate = data.request_to_speak_timestamp !== null ? new Date(data.request_to_speak_timestamp) : null;

    if (data.session_id !== undefined)
      this.sessionID = data.session_id;

    if (data.suppress !== undefined)
      this.suppress = data.suppress;

    if (data.user_id !== undefined)
      this.userID = data.user_id;

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.channel_id !== undefined)
      this.channelID = data.channel_id;

    if (data.self_mute !== undefined)
      this.self.mute = data.self_mute;

    if (data.self_deaf !== undefined)
      this.self.deaf = data.self_deaf;

    if (data.self_video !== undefined)
      this.self.video = data.self_video;

    if (data.self_stream !== undefined)
      this.self.stream = data.self_stream;

    if (data.mute !== undefined)
      this.server.mute = data.mute;

    if (data.deaf !== undefined)
      this.server.deaf = data.deaf;
  }

  setRequestToSpeak(request: boolean = true) {
    if (this.userID !== this.client.user.id)
      throw new Error('We do not own this Stage Channel');

    if (this.guildID !== undefined)
      throw new Error('Missing [guildID] property');

    return this.client.rest.dispatch<void, RESTPatchAPIVoiceStateRequestToSpeak>({
      endpoint: `/guilds/${this.guildID}/voice-states/@me`,
      method: 'PATCH',
      data: {
        request_to_speak_timestamp: request ? new Date().toISOString() : null,
        channel_id: this.channelID
      }
    });
  }

  inviteToSpeak() {
    if (this.guildID !== undefined)
      throw new Error('Missing [guildID] property');

    return this.client.rest.dispatch<void, RestPatchAPIVoiceStateInviteToSpeak>({
      endpoint: `/guilds/${this.guildID}/voices-states/${this.userID}`,
      method: 'PATCH',
      data: {
        request_to_speak_timestamp: new Date().toISOString(),
        channel_id: this.channelID,
        suppress: false
      }
    });
  }

  setAsSpeaker() {
    if (this.userID !== this.client.user.id)
      throw new Error('We do not own this Stage Channel');

    if (this.guildID !== undefined)
      throw new Error('Missing [guildID] property');

    return this.client.rest.dispatch<void, RestPatchAPIVoiceStateInviteToSpeak>({
      endpoint: `/guilds/${this.guildID}/voices-states/${this.userID}`,
      method: 'PATCH',
      data: {
        request_to_speak_timestamp: null,
        channel_id: this.channelID,
        suppress: false
      }
    });
  }

  setAsAudience() {
    if (this.userID !== this.client.user.id)
      throw new Error('We do not own this Stage Channel');

    if (this.guildID !== undefined)
      throw new Error('Missing [guildID] property');

    return this.client.rest.dispatch<void, RestPatchAPIVoiceStateInviteToSpeak>({
      endpoint: `/guilds/${this.guildID}/voices-states/${this.userID}`,
      method: 'PATCH',
      data: {
        request_to_speak_timestamp: null,
        channel_id: this.channelID,
        suppress: true
      }
    });
  }
}
