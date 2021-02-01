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
import { Guild, GuildEmoji, GuildMember, Message, User } from '../../../models';
import type { GatewayMessageReactionAddDispatchData } from 'discord-api-types';
import Event from '../../Event';

interface MessageReactionAddRefs {
  message: PartialEntity<Message>;
  channel: PartialEntity<TextableChannel>;
  member?: PartialEntity<GuildMember>;
  guild?: Guild;
  emoji: GuildEmoji;
  user: PartialEntity<User>;
}

export default class MessageReactionAddEvent extends Event<GatewayMessageReactionAddDispatchData, MessageReactionAddRefs> {
  get message() {
    return this.$refs.message;
  }

  get channel() {
    return this.$refs.channel;
  }

  get emoji() {
    return this.$refs.emoji;
  }

  get user() {
    return this.$refs.user;
  }

  get member() {
    return this.$refs.member;
  }

  process() {
    const channel: PartialEntity<TextableChannel> = this.client.channels.get<TextableChannel>(this.data.channel_id) ?? { id: this.data.channel_id };
    const message = (channel as AnyGuildTextableChannel).messages?.get(this.data.message_id) ?? { id: this.data.message_id };
    const guild = this.data.guild_id !== undefined ? this.client.guilds.get(this.data.guild_id) : undefined;
    const member = this.data.member !== undefined && this.data.member.user !== undefined
      ? guild?.members.get(this.data.member.user.id) ?? { id: this.data.member.user.id }
      : undefined;

    const user = this.client.users.get(this.data.user_id) ?? { id: this.data.user_id };
    this.$refs = {
      channel,
      message,
      member,
      emoji: new GuildEmoji(this.client, this.data.emoji),
      user
    };
  }
}
