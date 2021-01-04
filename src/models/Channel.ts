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

import type { APIPartialChannel } from 'discord-api-types/v8';
import type WebSocketClient from '../gateway/WebSocketClient';
import type { AnyChannel } from '../types';
import { ChannelTypesObject } from '../Constants';
import Base from './Base';

export class Channel extends Base<APIPartialChannel> {
  /** The type of channel */
  public type!: 'text' | 'dm' | 'voice' | 'group' | 'category' | 'news' | 'store';

  constructor(data: APIPartialChannel) {
    super(data.id);

    this.patch(data);
  }

  patch(data: APIPartialChannel) {
    this.type = ChannelTypesObject[data.type];
  }

  static from(client: WebSocketClient, data: any): AnyChannel {
    const { NewsChannel } = require('./channel/NewsChannel');
    const { DMChannel } = require('./channel/DMChannel');
    const { TextChannel } = require('./channel/TextChannel');
    const { CategoryChannel } = require('./channel/CategoryChannel');
    const { VoiceChannel } = require('./channel/VoiceChannel');
    const { StoreChannel } = require('./channel/StoreChannel');
    const { GroupChannel } = require('./channel/GroupChannel');

    switch (data.type) {
      case 0: return new TextChannel(client, data);
      case 1: return new DMChannel(client, data);
      case 2: return new VoiceChannel(client, data);
      case 3: return new GroupChannel(client, data);
      case 4: return new CategoryChannel(client, data);
      case 5: return new NewsChannel(client, data);
      case 6: return new StoreChannel(client, data);
      default:
        throw new SyntaxError(`Type "${data.type}" was not implemented (new channel type? make a pr!)`);
    }
  }
}
