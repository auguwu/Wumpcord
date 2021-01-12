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

import type WebSocketClient from '../gateway/WebSocketClient';
import type { APIUser } from 'discord-api-types';
import { User } from './User';

export class SelfUser extends User {
  /** If the user has MFA enabled (why do bots have this) */
  public mfaEnabled!: boolean;

  /** If the bot is verified or not */
  public verified!: boolean;

  /**
   * Creates a new [SelfUser] instance
   * @param client The [WebSocketClient] attached
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: APIUser) {
    super(client, data);

    this.patch(data);
  }

  patch(data: APIUser) {
    super.patch(data);

    if (data.mfa_enabled !== undefined)
      this.mfaEnabled = data.mfa_enabled;

    if (data.verified !== undefined)
      this.verified = data.verified;
  }
}
