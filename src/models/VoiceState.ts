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

import type { GatewayVoiceState } from 'discord-api-types';
import Base from './Base';

interface SelfVoiceState {
  stream: boolean;
  video: boolean;
  deaf: boolean;
  mute: boolean;
}

interface ServerVoiceState {
  deaf: boolean;
  mute: boolean;
}

export class VoiceState extends Base<GatewayVoiceState> {
  public channelID!: string | null;
  public sessionID!: string;
  public suppress!: boolean;
  public memberID!: string;
  public guildID!: string;
  public userID!: string;
  public server: ServerVoiceState;
  public self: SelfVoiceState;

  constructor(data: GatewayVoiceState) {
    super();

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

  patch(data: GatewayVoiceState) {
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

    if (data.self_mute !== undefined) this.self.mute = data.self_mute;
    if (data.self_deaf !== undefined) this.self.deaf = data.self_deaf;
    if (data.self_video !== undefined) this.self.video = data.self_video;
    if (data.self_stream !== undefined) this.self.stream = data.self_stream;
    if (data.mute !== undefined) this.server.mute = data.mute;
    if (data.deaf !== undefined) this.server.deaf = data.deaf;
  }
}
