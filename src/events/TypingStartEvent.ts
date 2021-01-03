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

import type { PartialEntity, TextableChannel, UserTyping } from '../types';
import type { GatewayTypingStartDispatchData } from 'discord-api-types';
import { User } from '../models';
import Event from './Event';

interface TypingStartReferences {
  channel: PartialEntity<TextableChannel>;
  typing?: UserTyping;
  user: PartialEntity<User>;
}

export class TypingStartEvent extends Event<GatewayTypingStartDispatchData, TypingStartReferences> {
  get user() {
    return this.client.users.get(this.$refs.user.id);
  }

  get channel() {
    return this.client.channels.get(this.$refs.channel.id);
  }

  get typing() {
    return this.$refs.typing;
  }

  private get _canCache() {
    if (this.client.options.cache === 'none') return false;
    if (this.client.options.cache === 'all') return true;

    return Array.isArray(this.client.options.cache)
      ? this.client.options.cache.includes('user:typings')
      : this.client.options.cache === 'user:typings';
  }

  async process() {
    const { data, client } = this;

    const channel = client.channels.get(data.channel_id) || { id: data.channel_id };
    const user = client.users.get(data.user_id) || { id: data.user_id };

    const chanType = channel.hasOwnProperty('type') ? (channel as TextableChannel).type : null;
    if (chanType !== null && !['dm', 'text', 'news'].includes(chanType)) {
      this.shard.debug(`Unable to emit 'typingStart': Channel ${channel.id} was not an instance of Text, DM, or News channel`);
      this.$refs = { channel, user };

      return;
    }

    let typing!: UserTyping;
    if (this._canCache) {
      if (this.client.typings.has(`${user.id}:${channel.id}`)) {
        typing = this.client.typings.get(`${user.id}:${channel.id}`)!;

        typing.lastTimestamp = new Date(data.timestamp * 1000);
        typing.elapsedTime = Date.now() - typing.since.getTime();
        typing.channel = channel;
        typing.user = user;
        clearTimeout(typing.timeout);
      } else {
        const since = new Date();
        const lastTimestamp = new Date();

        typing = {
          channel,
          user,
          since,
          lastTimestamp,
          elapsedTime: Date.now() - since.getTime(),
          timeout: setTimeout(() => this.client.typings.delete(`${user.id}:${channel.id}`), 10000)
        };

        this.client.typings.set(`${user.id}:${channel.id}`, typing);
      }
    }

    this.$refs = { user, channel, typing };
  }
}
