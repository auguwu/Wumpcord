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

import type { APIPartialChannel } from 'discord-api-types';
import type { WebSocketClient } from '../Client';
import { ChannelTypesObject } from '../Constants';
import { BaseEntity } from './BaseEntity';

/**
 * Represents the channel type for a [[Chanell]]
 */
export type ChannelType = typeof ChannelTypesObject[keyof typeof ChannelTypesObject];

/**
 * Represent a channel on Discord. This is just a no-op channel
 * for backwards compatibility and using the [[Channel#from]]
 * method to get a channel
 */
export class Channel extends BaseEntity<APIPartialChannel> {
  /**
   * The type this [[Channel]] is
   */
  public type: ChannelType;

  /**
   * Creates a new [[Channel]] instance
   * @param data The data from Discord
   */
  constructor(data: APIPartialChannel) {
    super(data.id);

    this.type = ChannelTypesObject[data.type];
  }

  static from<T extends Channel = Channel>(client: WebSocketClient, data: APIPartialChannel): T | null {
    // prevents circular references
    const { CategoryChannel, DMChannel, GroupChannel, NewsChannel, StageChannel, StoreChannel, TextChannel, VoiceChannel } = require('./channels');
    const channels = {
      0: TextChannel,
      1: DMChannel,
      2: VoiceChannel,
      3: GroupChannel,
      4: CategoryChannel,
      5: NewsChannel,
      6: StoreChannel,
      13: StageChannel
    };

    if (channels.hasOwnProperty(data.type))
      return new channels[data.type](client, data);
    else {
      client['debug'](`Channel ${data.type} (${ChannelTypesObject[data.type]}) is not available at this moment, create a PR maybe?`);
      return null;
    }
  }

  toString() {
    return `[wumpcord.Channel<${this.id}>]`;
  }
}
