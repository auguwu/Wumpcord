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

import type { APIChannel } from 'discord-api-types';
import WebSocketClient from '../../gateway/WebSocketClient';
import GuildChannel from './GuildChannel';

interface APIStageChannel extends Pick<APIChannel, 'guild_id' | 'position' | 'permission_overwrites' | 'name' | 'topic' | 'nsfw' | 'bitrate' | 'user_limit' | 'id' | 'type'> {
  /**
   * The voice region of the stage channel. (`null`: automatic based on the guild)
   */
  rtc_region: string | null;
}

export class StageChannel extends GuildChannel {
  /** The limit that users can join this [VoiceChannel] */
  public userLimit?: number;

  /** The bitrate of the voice channel */
  public bitrate?: number;

  /** The voice region of the stage channel. (`null`: automatic based on the guild) */
  public region!: string | null;

  /** The topic people are discussing in this [[StageChannel]]. `null` is set when there is nobody in the stage channel. */
  public topic!: string | null;

  /**
   * Constructs a new [[StageChannel]] instance
   * @param client The [[WebSocketClient]] attached
   * @param data The data passed in from Discord
   */
  constructor(client: WebSocketClient, data: APIStageChannel) {
    super(client, data);

    this.patch(data);
  }

  /**
   * Patch any updates from Discord
   * @param data The partial data
   */
  patch(data: Partial<APIStageChannel>) {
    super.patch(data as APIStageChannel);

    if (data.bitrate !== undefined)
      this.bitrate = data.bitrate;

    if (data.user_limit !== undefined)
      this.userLimit = data.user_limit;

    if (data.rtc_region !== undefined)
      this.region = data.rtc_region;

    if (data.topic !== undefined)
      this.topic = data.topic;
  }
}
