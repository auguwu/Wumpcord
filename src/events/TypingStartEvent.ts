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

import type { PartialEntity, TextableChannel } from '../types';
import type { GatewayTypingStartDispatchData } from 'discord-api-types';
import { User } from '../models';
import Event from './Event';

interface TypingStartReferences {
  channel: PartialEntity<TextableChannel>;
  user: PartialEntity<User>;
}

export class TypingStartEvent extends Event<GatewayTypingStartDispatchData, TypingStartReferences> {
  get user() {
    return this.client.users.get(this.$refs.user.id);
  }

  get channel() {
    return this.client.channels.get(this.$refs.channel.id);
  }

  async process() {
    const { data, client } = this;

    const channel = client.channels.get(data.channel_id) || { id: data.channel_id };
    const user = client.users.get(data.user_id) || { id: data.user_id };

    this.$refs = { user, channel };
  }
}
