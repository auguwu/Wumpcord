/**
 * Copyright (c) 2020 August
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

import type { UserPacket } from '../util/models';
import type { Client } from '../Client';
import { User } from './User';

// TODO: Implement the Extensions API
export class ClientUser extends User {
  public mfaEnabled!: boolean;
  public verified!: boolean;

  constructor(client: Client, data: UserPacket) {
    super(client, data);
  }

  update(data: UserPacket) {
    super.update(data);

    this.mfaEnabled = typeof data.mfa_enabled === 'boolean' && data.hasOwnProperty('mfa_enabled') ? data.mfa_enabled! : false;
    this.verified = typeof data.verified === 'boolean' && data.hasOwnProperty('verified') ? data.verified! : false;
  }
}