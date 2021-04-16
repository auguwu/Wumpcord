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

import type { WebSocketClient } from '../gateway/WebSocketClient';
import type { APIChannel } from 'discord-api-types';
import { TextableChannel } from './inheritable/TextableChannel';
import { User } from './User';

/**
 * Represents a DM channel
 */
export class DMChannel extends TextableChannel<APIChannel> {
  /**
   * Returns the last message ID from this [[DMChannel]]
   */
  public lastMessageID?: string;

  /**
   * Returns the recipient of this [[DMChannel]]
   */
  public recipient!: User;

  /**
   * Constructs a new instance of a [[DMChannel]]
   * @param client The client attached to this dm channel
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: APIChannel) {
    super(client, data);
  }

  patch(data: APIChannel) {
    super.patch(data);

    if (data.last_message_id !== undefined)
      this.lastMessageID = data.last_message_id !== null ? data.last_message_id : undefined;

    this.recipient = this.client.users.add(new User(this.client, data.recipients![0]));
  }
}
