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

import { ClientUser, PrivateChannel, GroupChannel } from '../../structures';
import { ChannelTypes } from '../../util/Constants';
import type * as models from '../../util/models';
import type { Event } from './types';

export const Ready: Event<models.ReadyPacket> = function (data) {
  this.client.user = new ClientUser(this.client, data.user);
  this.sessionID = data.d.session_id;

  if (data.t === 'RESUMED') {
    this.ackHeartbeat();
    this.client.emit('resume');
  }

  if (
    // If we shouldn't cache at all
    this.client.options.cache === 'none' || 

    // If we should ***only*** cache guilds
    this.client.options.cache !== 'guild' ||
    
    // If we didn't include guilds to be cached
    !this.client.options.cache.includes('guild')
  ) {
    this.client.guilds = data.d.guilds.length;
  } else {
    for (const guild of data.d.guilds) {
      console.log(guild); // idk what this data is man!
    }
  }

  if (data.private_channels.length) {
    data.private_channels.forEach(channel => {
      const shouldCache = this.client.options.cache === 'none' || this.client.options.cache !== 'channel' || !this.client.options.cache.includes('channel');

      if (!channel.type || channel.type === ChannelTypes.DM) {
        if (shouldCache) {
          this.client.channels.add(new PrivateChannel(this.client, channel));
        } else {
          this.client.channels++;
        }
      } else if (channel.type === ChannelTypes.Group) {
        if (shouldCache) {
          this.client.channels.add(new GroupChannel(this.client, channel));
        } else {
          this.client.channels++;
        }
      }
    });
  }

  if (data.d.guilds.length) {
    this.guilds = new Set(data.d.guilds.map(s => s.id));
  }

  this.client.emit('ready');
};