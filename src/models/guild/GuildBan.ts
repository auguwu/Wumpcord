/**
 * Copyright (c) 2020 August, Ice
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

import type WebSocketClient from '../../gateway/WebSocketClient';
import type { APIUser } from 'discord-api-types/v8';
import { User } from '../User';

interface GuildBanProperties {
  reason?: string;
  user: APIUser;
}

export default class GuildBan {
  /** The reason of the ban */
  public reason!: string;

  /** The user's ID who was banned */
  public userID!: string;

  /** The [WebSocketClient] attached to this [GuildBan] */
  private client: WebSocketClient;

  /** The user who was banned, if cached */
  public user!: User;

  /**
   * Creates a new [GuildBan] instance
   * @param client The [WebSocketClient] attached
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: GuildBanProperties) {
    this.client = client;

    this.patch(data);
  }

  private patch(data: GuildBanProperties) {
    this.userID = data.user.id;
    this.user = this.client.users.add(new User(this.client, data.user));

    if (data.reason !== undefined)
      this.reason = data.reason;
  }

  toString() {
    return `[wumpcord.GuildBan<U: ${this.user.tag}${this.reason ? `, R: ${this.reason}` : ''}>]`;
  }
}
