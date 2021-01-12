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

import type { AnyGuildTextableChannel, TextableChannel } from '../../types';
import type { GatewayMessageCreateDispatchData } from 'discord-api-types';
import type { Guild } from '../../models';
import { Message } from '../../models/Message';
import Event from '../Event';

interface MessageCreateRefs {
  channel: TextableChannel;
  guild?: Guild;
}

export default class MessageCreateEvent extends Event<GatewayMessageCreateDispatchData, MessageCreateRefs> {
  get channel() {
    return this.$refs.channel;
  }

  get guild() {
    return this.$refs.guild;
  }

  get message() {
    return new Message(this.client, this.data);
  }

  async process() {
    const channel = this.client.channels.get(this.data.channel_id)! as AnyGuildTextableChannel;
    const guild = this.data.guild_id !== undefined
      ? this.client.guilds.get(this.data.guild_id)!
      : undefined;

    if (channel !== null && ['news', 'text'].includes(channel.type)) {
      channel.messages.cache.set(this.message.id, this.message);
      this.client.channels.cache.set(channel.id, channel);
    }

    this.$refs = { channel: (channel as unknown as TextableChannel), guild };
  }
}
