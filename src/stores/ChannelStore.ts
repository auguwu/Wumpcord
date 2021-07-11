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
import type { APIChannel } from 'discord-api-types';
import { BaseStore } from './BaseStore';
import { Channel } from '../entities/Channel';

/**
 * Entity store for channels
 */
export class ChannelStore extends BaseStore<Channel> {
  /**
   * Constructs a new [[ChannelStore]] instance
   * @param client The client
   */
  constructor(client: WebSocketClient) {
    super(client);
  }

  /** @inheritdoc */
  get<T extends Channel = Channel>(id: string) {
    return super.get(id) as T | undefined;
  }

  /**
   * Method to fetch a channel from Discord (and possibly cast it from the `T` generic)
   * @param id The snowflake to use
   * @returns A promise that has the class resolved and *possibly* cached or
   * a promise that rejects this request and throws a [[DiscordRestError]] on why it failed.
   */
  fetch<T extends Channel = Channel>(id: string): Promise<T | null> {
    return this.client.rest.dispatch<never, APIChannel>({
      endpoint: '/channels/:id',
      method: 'GET',
      query: { id }
    }).then(data => {
      const channel = Channel.from<T>(this.client, data);
      if (channel === null) {
        this.client.emit('debug', `Received unknown channel type ${data.type}, returning null & not caching`);
        return null;
      }

      return this.put(channel) as unknown as T;
    });
  }
}
