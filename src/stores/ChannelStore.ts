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

import { Channel, TextChannel, PrivateChannel, GroupChannel, CategoryChannel, StoreChannel, NewsChannel } from '../structures';
import type * as models from '../util';
import type { Client } from '../Client';
import { BaseStore } from './BaseStore';
import { ChannelTypes } from '../util/Constants';

export class ChannelStore extends BaseStore<Channel> {
  constructor(client: Client) {
    super(client, Channel, 'channel');
  }

  getTextChannel(id: string) {
    const exists = this.resolve(id);
    if (exists) return exists as TextChannel;

    return this.client.rest.dispatch<models.ChannelPacket>({
      method: 'GET',
      endpoint: `/channels/${id}`
    }).then((data) => {
      if (data.type !== ChannelTypes.Text) throw new Error(`Channel by ID "${id}" was not a text channel.`);
      
      this.add(data);
      return new TextChannel(this.client, data);
    });
  }

  getPrivateChannel(id: string) {
    const exists = this.resolve(id);
    if (exists) return exists as PrivateChannel;

    return this.client.rest.dispatch<models.ChannelPacket>({
      method: 'GET',
      endpoint: `/channels/${id}`
    }).then((data) => {
      if (data.type !== ChannelTypes.DM) throw new Error(`Channel by ID "${id}" was not a DM channel.`);
      
      this.add(data);
      return new PrivateChannel(this.client, data);
    });
  }
}