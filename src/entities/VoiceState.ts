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

import type { GatewayVoiceState, RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody, RESTPatchAPIGuildVoiceStateUserJSONBody, Snowflake } from 'discord-api-types';
import type { StageChannel, VoiceChannel } from './channels';
import type { WebSocketClient } from '../Client';
import { BaseEntity } from './BaseEntity';

/**
 * Represents the voice state of the user itself.
 */
export interface SelfVoiceState {
  /**
   * Whether this user is streaming using the "Go Live" feature
   */
  stream?: boolean;

  /**
   * Whether this user's camera is enabled
   */
  video: boolean;

  /**
   * Whether this user is locally deafened
   */
  deaf: boolean;

  /**
   * Wether this user is locally muted
   */
  mute: boolean;
}

/**
 * Represents the voice state of the user in the guild this
 * voice state belongs to.
 */
export interface ServerVoiceState {
  /**
   * Whether this user is deafened by the server
   */
  deaf: boolean;

  /**
   * Wether this user is muted by the server
   */
  mute: boolean;
}

/**
 * https://discord.com/developers/docs/resources/voice#voice-state-object
 */
export class VoiceState extends BaseEntity<GatewayVoiceState> {
  /**
   * The time at which the user has requested to speak
   */
  public requestToSpeakDate!: Date | null;

  /**
   * The channel ID this user is connected to
   */
  public channelID!: string | null;

  /**
   * Session ID for this voice state
   */
  public sessionID!: string;

  /**
   * Whether this user is muted by the current user
   */
  public suppress!: boolean;

  /**
   * The guild id this voice state is for
   */
  public guildID?: string;

  /**
   * Object of the status of the voice state by this user in the guild
   */
  public server!: ServerVoiceState;

  /**
   * Guild member this voice state is for
   */
  public member?: any;

  /**
   * The user ID this voice state is for
   */
  public userID!: string;

  /**
   * Object of the status of the voice state by this user
   */
  public self!: SelfVoiceState;

  constructor(private client: WebSocketClient, data: GatewayVoiceState) {
    super(data.user_id);

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

  patch(data: Partial<GatewayVoiceState>) {
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

  get channel() {
    if (this.channelID === null)
      return null;

    return this.client.channels.get<VoiceChannel | StageChannel>(this.channelID)!;
  }

  /**
   * Toggles the request to speak in the channel the bot is in.
   * Only applicable for stage channels + the client's own voice state.
   *
   * @param request If the bot should raise it hand or not
   */
  requestToSpeak(request = true) {
    if (this.userID !== this.client.user.id)
      throw new Error('We do not own this Stage Channel');

    if (this.channel?.type !== 'stage')
      throw new Error('Channel for this voice state was not a stage channel');

    return this.client.rest.dispatch<RESTPatchAPIGuildVoiceStateCurrentMemberJSONBody, void>({
      endpoint: '/guilds/:guildID/voice-states/@me',
      method: 'PATCH',
      query: {
        guildID: this.guildID!
      },

      data: {
        request_to_speak_timestamp: request ? new Date().toISOString() : null,
        channel_id: this.channelID! as Snowflake
      }
    });
  }

  /**
   * Suppress/unsupress the user, only applicable for stage channels.
   * @param suppressed If we should suppress or not.
   */
  setSupressed(suppressed = true) {
    if (this.channel?.type !== 'stage')
      throw new TypeError('Channel for this voice state is not a stage channel');

    const target = this.client.user.id === this.id ? '@me' : this.id;
    return this.client.rest.dispatch<RESTPatchAPIGuildVoiceStateUserJSONBody, void>({
      endpoint: '/guilds/:guildID/voice-states/:target',
      method: 'PATCH',
      query: {
        guildID: this.guildID!,
        target
      },

      data: {
        channel_id: this.channelID as Snowflake,
        suppress: suppressed
      }
    });
  }
}
