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

import type { AnyChannel, PartialEntity } from '../../types';
import type { GatewayMessageUpdateDispatchData } from 'discord-api-types';
import { Message } from '../../models';
import Event from '../Event';

interface MessageUpdateRefs<C extends AnyChannel = AnyChannel> {
  message: PartialEntity<Message, { channel: C }>;
  old: Message | null;
}

export default class MessageUpdateEvent<C extends AnyChannel = AnyChannel> extends Event<GatewayMessageUpdateDispatchData, MessageUpdateRefs<C>> {
  get message() {
    return this.$refs.message;
  }

  get old() {
    return this.$refs.old;
  }

  process() {
    const message = this.data.hasOwnProperty('content') ? new Message(this.client, <any> this.data) : {
      channel: this.client.channels.get<C>(this.data.channel_id)!,
      id: this.data.id
    } as PartialEntity<Message, { channel: C }>;

    const old = this.client.channels.get<any>(this.data.channel_id)?.messages?.get(this.data.id) ?? null;

    this.$refs = { message: (message as any), old };
  }
}
