/**
 * Copyright (c) 2020-2021 August, Ice
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

import type { APIChannel, APIMessage, RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/v8';
import type { MessageContent, MessageContentOptions } from '../../types';
import type WebSocketClient from '../../gateway/WebSocketClient';
import GuildChannel from './GuildChannel';
import { Message } from '../Message';
import Util from '../../util';

export class TextChannel extends GuildChannel {
  /** The ratelimit per user, how long they can send a message */
  public ratelimitPerUser!: number;

  /** The channel's topic */
  public topic!: string | null;

  /**
   * Creates a new [TextChannel] instance
   * @param client The [WebSocketClient] attached
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: APIChannel) {
    super(client, data);

    this.patch(data);
  }

  patch(data: APIChannel) {
    super.patch(data);

    if (data.rate_limit_per_user !== undefined)
      this.ratelimitPerUser = data.rate_limit_per_user;

    if (data.topic !== undefined)
      this.topic = data.topic;
  }

  /**
   * Sends a message in this text channel
   * @param content The message content
   * @param options Any additional options to send
   */
  send(content: MessageContent, options?: MessageContentOptions) {
    const data = Util.formatMessage(this.client, content, options);
    const file = data.file;

    // delete it so it doesn't bleed when sending
    delete data.file;

    return this.client.rest.dispatch<APIMessage, RESTPostAPIChannelMessageJSONBody>({
      endpoint: `/channels/${this.id}/messages`,
      method: 'POST',
      file,
      data
    }).then(data => new Message(this.client, data));
  }

  toString() {
    return `[wumpcord.TextChannel<${this.name}>]`;
  }
}
