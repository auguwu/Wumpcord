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

/* eslint-disable camelcase */

import { APIMessage, RESTPostAPIChannelFollowersJSONBody, RESTPostAPIChannelFollowersResult, RESTPostAPIChannelMessageJSONBody, Snowflake } from 'discord-api-types';
import type { MessageContent, MessageContentOptions } from '../../types';
import { GuildTextableChannel } from './GuildTextableChannel';
import Util from '../../util';

/**
 * A channel that users with `MANAGE_MESSAGES` permission can crosspost messages
 * to servers.
 *
 * This class is only for documentation purposes + type checking,
 * the only thing you can do with news channels is crosspost messages and follow channels.
 *
 * If you need to check if you can crosspost a message, you can use the
 * [GuildTextableChannel.crosspostable] / [TextableChannel.crosspostable] getter
 * to check.
 */
export class NewsChannel extends GuildTextableChannel {
  /**
   * Follows this [NewsChannel] to a different channel
   * @param channelID The channel's ID
   */
  follow(channelID: string) {
    return this['client'].rest.dispatch<RESTPostAPIChannelFollowersJSONBody, RESTPostAPIChannelFollowersResult>({
      endpoint: '/channels/:id/followers',
      method: 'POST',
      query: { id: channelID },
      data: {
        webhook_channel_id: channelID as Snowflake
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
  crosspost(messageID: string, content: MessageContent, options?: MessageContentOptions) {
    const data = Util.formatMessage(this['client'], content, options);
    const file = data.file;

    delete data.file;
    return this['client'].rest.dispatch<RESTPostAPIChannelMessageJSONBody, APIMessage>({
      endpoint: '/channels/:channelID/messages/:messageID/crosspost',
      method: 'POST',
      query: {
        channelID: this.id,
        messageID
      },
      file,
      data
    });
  }
}
