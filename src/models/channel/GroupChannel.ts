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
import { Channel } from '../Channel';
import { User } from '../User';
import Util from '../../util';

export class GroupChannel extends Channel {
  /** The last pinned message's timestamp */
  public lastPinTimestamp!: string | null;

  /** Represents the last message ID, useful for fetching messages in this channel */
  public lastMessageID!: string | null;

  /** List of recipients that are in this group DM */
  public recipients!: User[];

  /** The owner's ID, who-ever created the group DM */
  public ownerID!: string;

  /** The [WebSocket] client attached to this [GroupChannel] */
  private client: WebSocketClient;

  /** The name of the group DM */
  public name!: string;

  /** The group DM's icon */
  public icon!: string | null;

  /**
   * Creates a new [GroupChannel] instance
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

    if (data.last_message_id !== undefined)
      this.lastMessageID = data.last_message_id;

    if (data.last_pin_timestamp !== undefined)
      this.lastPinTimestamp = data.last_pin_timestamp;

    if (data.owner_id !== undefined)
      this.ownerID = data.owner_id;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.icon !== undefined)
      this.icon = data.icon;

    this.recipients = data.recipients!.map(data => this.client.users.add(new User(this.client, data)));
  }

  /**
   * Sends a message in this DM channel
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
    return `[wumpcord.GroupChannel "${this.name}"]`;
  }
}