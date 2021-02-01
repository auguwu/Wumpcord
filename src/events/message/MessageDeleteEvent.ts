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

import type { AnyGuildTextableChannel, PartialEntity } from '../../types';
import type { GatewayMessageDeleteDispatchData } from 'discord-api-types';
import type { Guild, Message } from '../../models';
import Event from '../Event';

interface MessageDeleteRefs {
  message: PartialEntity<Message>;
  channel: PartialEntity<AnyGuildTextableChannel>;
  guild?: PartialEntity<Guild>;
}

export default class MessageDeleteEvent extends Event<GatewayMessageDeleteDispatchData, MessageDeleteRefs> {
  get message() {
    return this.$refs.message;
  }

  get channel() {
    return this.$refs.channel;
  }

  get guild() {
    return this.$refs.guild;
  }

  process() {
    const channel = this.client.channels.get<AnyGuildTextableChannel>(this.data.channel_id) ?? { id: this.data.channel_id };
    const guild = this.data.guild_id !== undefined
      ? this.client.guilds.get(this.data.guild_id) ?? { id: this.data.guild_id }
      : undefined;

    if (!(<any> channel).messages) {
      this.shard.debug('Channel was not a text or news channel, skipping');
      this.$refs = {
        channel,
        guild,
        message: {
          id: this.data.id
        }
      };

      return;
    }

    const message = (channel as AnyGuildTextableChannel).messages.get(this.data.id) ?? { id: this.data.id };
    this.$refs = {
      channel,
      guild,
      message
    };
  }
}
