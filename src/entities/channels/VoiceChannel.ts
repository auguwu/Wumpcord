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

import type { WebSocketClient } from '../../Client';
import type { APIChannel } from 'discord-api-types';
import { Collection } from '@augu/collections';
import { GuildChannel } from './GuildChannel';
import type { Member } from '../Member';

/**
 * https://discord.com/developers/docs/resources/channel#channel-object
 */
export class VoiceChannel extends GuildChannel {
  /**
   * The limit of users that can connect to this voice channel
   */
  public userLimit?: number;

  /**
   * The bitrate that this voice channel is in.
   */
  public bitrate?: number;

  /**
   * The region of this voice channel, returns `null` if it's
   * automatic.
   */
  public region!: string | null;

  constructor(client: WebSocketClient, data: APIChannel) {
    super(client, data);

    this.patch(data);
  }

  patch(data: Partial<APIChannel>) {
    super.patch(data);

    if (data.rtc_region !== undefined)
      this.region = data.rtc_region;

    if (data.user_limit !== undefined)
      this.userLimit = data.user_limit;

    if (data.bitrate !== undefined)
      this.bitrate = data.bitrate;
  }

  /**
   * Check if the bot can join this voice channel
   */
  get joinable() {
    return false;
  }

  /**
   * Returns the members of this voice channel
   */
  get members() {
    return new Collection<string, Member>();
  }
}
