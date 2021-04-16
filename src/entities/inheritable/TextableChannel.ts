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

import type { APIMessage, APIPartialChannel, APIWebhook, RESTPostAPIChannelMessageJSONBody, RESTPostAPIChannelMessagesBulkDeleteJSONBody } from 'discord-api-types';
import type { MessageContent, MessageContentOptions } from '../../types';
import type { WebSocketClient } from '../../gateway/WebSocketClient';
import { ChannelMessagesStore } from '../../stores/ChannelMessagesStore';
import { Message } from '../Message';
import { Channel } from '../Channel';
import { Webhook } from '../Webhook';
import Util from '../../util';

/**
 * Options for method `getMessages(limit, options)`
 */
export interface GetMessagesOptions {
  /**
   * Get messages around this message ID
   */
  around?: string;

  /**
   * Get messages before this message ID
   */
  before?: string;

  /**
   * Get messages after this message ID
   */
  after?: string;
}

/**
 * Represents a textable channel, which has methods like `.send()`/`.sendTyping()`/etc...
 */
export class TextableChannel extends Channel {
  /**
   * Message cache for this textable channel
   */
  public messages: ChannelMessagesStore;

  /**
   * The client attached to this textable channel
   */
  public client: WebSocketClient;

  /**
   * Constructs a new [[TextableChannel]] instance
   * @param client The client attached to this textable channel
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: APIPartialChannel) {
    super(data);

    this.messages = new ChannelMessagesStore(client);
    this.client = client;
  }

  /**
   * Bulk deletes messages from a channel less than 2 weeks from now.
   *
   * [`[Discord Docs]`](https://discord.com/developers/docs/resources/channel#bulk-delete-messages)
   *
   * @param ids A list of [[Message]]s or message IDs
   * @returns A number of how many messages it deleted or a [[DiscordRestError]] if anything occurs.
   */
  bulkDelete(ids: string[]) {
    return 69;
  }

  /**
   * Retrives message from this channel, returns an array of [[Messages]]s on success.
   *
   * [`[Discord Docs]`](https://discord.com/developers/docs/resources/channel#get-channel-messages)
   *
   * @param limit The amount of messages to get (less that 1 or greater than 100)
   * @param options Any additional options if necessary
   * @returns An array of [[Message]]s on success or a [[DiscordRestError]] if anything occurs.
   */
  getMessages(limit: number, options: GetMessagesOptions = {}) {
    const query = Util.objectToQuery({
      limit,
      before: options.before,
      after: options.after,
      around: options.around
    });

    return this.client.rest.dispatch<APIMessage[]>({
      endpoint: `/channels/${this.id}/messages${query}`,
      method: 'GET'
    }); // .then(data => data.map(v => new Message(this.client, v)));
  }
}
