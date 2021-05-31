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

import { APIChannel, APIMessage, APIWebhook, RESTPostAPIChannelMessageJSONBody, RESTPostAPIChannelMessagesBulkDeleteJSONBody } from 'discord-api-types';
import type { MessageContent, MessageContentOptions } from '../../types';
import type { WebSocketClient } from '../../Client';
import { Channel } from '../Channel';
import { Webhook } from '../Webhook';
import Util from '../../util';

/**
 * https://discord.com/developers/docs/resources/channel#get-channel-messages-query-string-params
 */
export interface RetrieveMessagesOptions {
  /**
   * Snowflake to retrieve messages around
   */
  around?: string;

  /**
   * Snowflake to retrieve messages before
   */
  before?: string;

  /**
   * Snowflake to retrieve messages after
   */
  after?: string;

  /**
   * Value between 1-100 messages to return
   */
  limit?: number;
}

/**
 * Represents a "textable" channel, where it inherits stuff like `.send` for an example.
 */
export class TextableChannel extends Channel {
  private client: WebSocketClient;

  /**
   * Creates a new [[TextableChannel]] instance
   * @param client The WebSocketClient to attach
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: APIChannel) {
    super(data);

    this.client = client;
  }

  /**
   * Returns a boolean if this channel can cross-post messages.
   */
  get crosspostable() {
    return this.type === 'news';
  }

  /**
   * Deletes multiple messages in a single request. ([`Discord Docs`](https://discord.com/developers/docs/resources/channel#bulk-delete-messages))
   * @param messages Array of [[Message]]s or [[Snowflake]]s of what to delete
   * @returns A promise that resolves as how many messages were deleted.
   */
  bulkDelete(messages: string[]) {
    if (!Array.isArray(messages))
      throw new TypeError('expected array');

    const shouldDelete = messages as `${bigint}`[];

    if (!shouldDelete.length)
      return Promise.resolve(0);

    if (shouldDelete.length === 1) {
      const id = shouldDelete[0];
      return this.client.rest.dispatch<any, void>({
        endpoint: '/channels/:channelID/messages/:id',
        method: 'DELETE',
        query: {
          channelID: this.id,
          id
        }
      }).then(() => 1);
    }

    return this.client.rest.dispatch<RESTPostAPIChannelMessagesBulkDeleteJSONBody, void>({
      endpoint: '/channels/:id/messages/bulk-delete',
      method: 'POST',
      query: { id: this.id },
      data: {
        messages: shouldDelete
      }
    }).then(() => shouldDelete.length);
  }

  /**
   * Retrieves the messages of this [[TextableChannel]].
   * @param options Any additional options to use
   */
  getMessages(options?: RetrieveMessagesOptions) {
    options = Object.assign(options, { limit: 50 });

    const query = Util.objectToQuery(options);
    return this.client.rest.dispatch<unknown, APIMessage[]>({
      endpoint: `/channels/:id/messages${query}`,
      method: 'GET',
      query: { id: this.id }
    });
  }

  /**
   * Triggers the "user typing" indicator. ([`Discord Docs`](https://discord.com/developers/docs/resources/channel#trigger-typing-indicator))
   */
  sendTyping() {
    return this.client.rest.dispatch<unknown, void>({
      endpoint: '/channels/:id/typing',
      method: 'POST',
      query: { id: this.id }
    });
  }

  /**
   * Retrieves all the pins of this [[TextableChannel]] ([`Discord Docs`](https://discord.com/developers/docs/resources/channel#get-pinned-messages))
   */
  getPins() {
    return this.client.rest.dispatch<unknown, APIMessage[]>({
      endpoint: '/channels/:id/messages/pins',
      method: 'GET',
      query: { id: this.id }
    });
  }

  /**
   * Retrieves all of the webhooks available in this [[TextableChannel]]. ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#get-channel-webhooks))
   */
  getWebhooks() {
    return this.client.rest.dispatch<unknown, APIWebhook[]>({
      endpoint: '/channels/:id/webhooks',
      method: 'GET',
      query: { id: this.id }
    }).then(data => data.map(v => new Webhook(this.client, v)));
  }

  /**
   * Sends a message to this current [[TextableChannel]] with any payload to send. ([`Discord Docs`](https://discord.com/developers/docs/resources/channel#create-message))
   * @param content The message content or options to send
   * @param options Any additional options to use to send this message
   */
  send(content: MessageContent, options?: MessageContentOptions) {
    const data = Util.formatMessage(this.client, content, options);
    const file = data.file;

    delete data.file;

    return this.client.rest.dispatch<RESTPostAPIChannelMessageJSONBody, APIMessage>({
      endpoint: '/channels/:id/messages',
      method: 'POST',
      query: { id: this.id },
      file,
      data
    });
  }
}
