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

/* eslint-disable camelcase */

import type { RESTPostAPIChannelMessageJSONBody, APIMessage } from 'discord-api-types/v8';
import type { MessageContent, MessageContentOpts } from '../../types';
import { TextChannel } from './TextChannel';
import { Message } from '../Message';
import Util from '../../util';

interface FollowedChannel {
  channel_id: string;
  webhook_id: string;
}

export class NewsChannel extends TextChannel {
  /**
   * Follows this [NewsChannel] to a different channel
   * @param channelID The channel's ID
   * @returns The result, if it was a success or not
   */
  follow(channelID: string) {
    return this.client.rest.dispatch<FollowedChannel, { webhook_channel_id: string }>({
      endpoint: `/channels/${this.id}/followers`,
      method: 'post',
      data: {
        webhook_channel_id: channelID
      }
    });
  }

  /**
   * Crossposts a message to all the followers who subscribed to this [NewsChannel]
   * @param messageID The message ID to crosspost
   * @param content The content to send out
   * @param options Any additional options, if needed
   * @returns A new [Message] instance indicating it was sent
   */
  crosspost(messageID: string, content: MessageContent, options?: MessageContentOpts) {
    const data = Util.getMessageContent(this.client, content, options);

    return this.client.rest.dispatch<APIMessage, RESTPostAPIChannelMessageJSONBody>({
      endpoint: `/channels/${this.id}/messages/${messageID}/crosspost`,
      headers: data.headers,
      method: 'post',
      data: data.body
    }).then(data => new Message(this.client, data));
  }
}
