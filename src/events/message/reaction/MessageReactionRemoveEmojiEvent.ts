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

import type { AnyGuildTextableChannel, PartialEntity, TextableChannel } from '../../../types';
import type { GatewayMessageReactionRemoveEmojiDispatchData } from 'discord-api-types';
import { Guild, GuildEmoji, Message } from '../../../models';
import Event from '../../Event';

interface MessageReactionRemoveEmojiRefs {
  message: PartialEntity<Message>;
  channel: PartialEntity<TextableChannel>;
  guild?: PartialEntity<Guild>;
  emoji: GuildEmoji;
}

export default class MessageReactionRemoveEmojiEvent extends Event<
  GatewayMessageReactionRemoveEmojiDispatchData,
  MessageReactionRemoveEmojiRefs
> {
  get message() {
    return this.$refs.message;
  }

  get channel() {
    return this.$refs.channel;
  }

  get guild() {
    return this.$refs.guild;
  }

  get emoji() {
    return this.$refs.emoji;
  }

  process() {
    const channel = this.client.channels.get<TextableChannel>(this.data.channel_id) ?? { id: this.data.channel_id };
    const message = (channel as AnyGuildTextableChannel).messages?.get(this.data.message_id) ?? { id: this.data.message_id };
    const guild = this.data.guild_id !== undefined ? this.client.guilds.get(this.data.guild_id) ?? { id: this.data.guild_id } : undefined;

    this.$refs = {
      channel,
      message,
      guild,
      emoji: new GuildEmoji(this.client, this.data.emoji)
    };
  }
}
