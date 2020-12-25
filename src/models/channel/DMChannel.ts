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

import type { APIChannel } from 'discord-api-types/v8';
import type WebSocketClient from '../../gateway/WebSocketClient';
import { Channel } from '../Channel';

export class DMChannel extends Channel {
  /** Represents the last message ID, useful for fetching messages in this channel */
  public lastMessageID!: string;

  /** List of recipients that are in this group DM */
  public recipient!: any;

  /** The [WebSocket] client attached to this [GroupChannel] */
  private client: WebSocketClient;

  /**
   * Creates a new [DMChannel] instance
   * @param client The [WebSocket] client attached
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: APIChannel) {
    super(data);

    this.client = client;
    this.patch(data);
  }

  patch(data: APIChannel) {
    super.patch(data);

    this.lastMessageID = data.last_message_id!;
    this.recipient = data.recipients![0];
  }

  toString() {
    return `[wumpcord.DMChannel<${this.recipient.tag}>]`;
  }
}