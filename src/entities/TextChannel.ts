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

import type { WebSocketClient } from '../Client';
import { GuildTextableChannel } from './GuildTextableChannel';
import type { APIChannel } from 'discord-api-types';

/**
 * https://discord.com/developers/docs/resources/channel#channel-object
 */
export class TextChannel extends GuildTextableChannel {
  /**
   * Date-represented value of when the last pinned message was pinned. Returns `null`
   * if there is no pinned messages.
   */
  public lastPinTimestamp?: Date | null;

  /**
   * Amount of seconds a user has to wait before sending another message, in range of
   * 0 - 21600. Bots, as well users with permissions `MANAGE_MESSAGES` or `MANAGE_CHANNEL` are unaffected.
   */
  public ratelimitPerUser?: number;

  /**
   * The last message of this [[TextChannel]] mapped by ID.
   * Use [[TextChannel.lastMessage]] to return the last, cached
   * message.
   */
  public lastMessageID?: string | null;

  /**
   * The channel's topic, returns `null` if none is set.
   */
  public topic!: string | null;

  constructor(client: WebSocketClient, data: APIChannel) {
    super(client, data);

    this.patch(data);
  }

  patch(data: Partial<APIChannel>) {
    super.patch(data);

    if (data.last_pin_timestamp !== undefined)
      this.lastPinTimestamp = data.last_pin_timestamp !== null ? new Date(data.last_pin_timestamp) : null;

    if (data.rate_limit_per_user !== undefined)
      this.ratelimitPerUser = data.rate_limit_per_user;

    if (data.last_message_id !== undefined)
      this.lastMessageID = data.last_message_id;

    if (data.topic !== undefined)
      this.topic = data.topic;
  }

  /**
   * Returns the last cached message of this [[TextChannel]]. Requires the
   * message cache entity to be present.
   */
  get lastMessage() {
    return null;
  }

  toString() {
    return `[wumpcord.TextChannel (${this.name})]`;
  }
}
