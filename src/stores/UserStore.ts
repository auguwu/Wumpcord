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
import type { APIUser } from 'discord-api-types';
import { BaseStore } from './BaseStore';
import { User } from '../entities';

/**
 * Entity store for users
 */
export class UserStore extends BaseStore<User> {
  constructor(client: WebSocketClient) {
    super(client, 'users');
  }

  /**
   * Method to fetch a user from Discord.
   *
   * @param id The snowflake to use
   * @returns A promise that has the class resolved and *possibly* cached or
   * a promise that rejects this request and throws a [[DiscordRestError]] on why it failed.
   */
  fetch(id: string) {
    return this.client.rest.dispatch<never, APIUser>({
      endpoint: '/users/:id',
      method: 'GET',
      query: { id },
      auth: true
    }).then(data => this.put(new User(this.client, data)));
  }
}
