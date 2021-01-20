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

/* eslint-disable camelcase */

import type { GatewayInteractionCreateDispatchData } from 'discord-api-types';
import type { AnyGuildTextableChannel } from '../../types';
import { Guild, GuildMember, InteractionMessage, Message } from '../../models';
import type ApplicationCommand from '../../interactions/Command';
import type * as interactions from '../../interactions/types';
import Event from '../Event';

interface InteractionCreateRefs {
  command?: ApplicationCommand;
  message?: InteractionMessage;
  channel: AnyGuildTextableChannel;
  guild: Guild;
}

export default class InteractionCreateEvent extends Event<GatewayInteractionCreateDispatchData, InteractionCreateRefs> {
  get member() {
    return new GuildMember(this.client, {
      guild_id: this.data.guild_id, // eslint-disable-line camelcase
      ...this.data.member
    });
  }

  get command() {
    return this.$refs.command;
  }

  get token() {
    return this.data.token;
  }

  get channel() {
    return this.$refs.channel;
  }

  get guild() {
    return this.$refs.guild;
  }

  get message() {
    return this.$refs.message;
  }

  // Credit: https://github.com/FurryBotCo/FurryBot/blob/master/src/events/rawWS.ts#L53
  _format() {
    if (!this.command) return {
      roleMentions: [],
      userMentions: [],
      content: ''
    };

    if (!this.command.options) return {
      roleMentions: [],
      userMentions: [],
      content: `/${this.command.name}`
    };

    const roleMentions: string[] = [];
    const userMentions: string[] = [];
    let content = `/${this.command!.name}`;

    const formatArgument = (arg: interactions.ApplicationCommandOption) => {
      // @ts-ignore
      if (arg.options !== undefined && !arg.value) {
        const args = arg.options.map(arg => formatArgument(arg));
        return `${arg.name} ${args.join(' ')}`;
      }

      if (['member', 'user'].some(e => arg.name.startsWith(e))) {
        // @ts-ignore
        userMentions.push(arg.value);

        // @ts-ignore
        return `<@!${arg.value}>`;
      } else if (arg.name === 'channel') {
        // @ts-ignore
        return `<@#${arg.value}>`;
      } else if (arg.name === 'role') {
        // @ts-ignore
        roleMentions.push(arg.value);

        // @ts-ignore
        return `<@&${arg.value}>`;
      } else {
        // @ts-ignore
        return arg.value;
      }
    };

    this.command!.options?.forEach(option => {
      const choices = (option.choices?.length ?? false)
        ? option.choices!.map(choice =>
          choice !== undefined
            ? undefined
            : `${choice!.name}: ${choice!.value}`
        ).filter(c => c !== undefined) : null;

      if (choices !== null) {
        content += ` ${choices.join(' ')}`;
        return;
      }

      content += ` ${formatArgument(option)}`;
    });

    return {
      roleMentions,
      userMentions,
      content
    };
  }

  async process() {
    const { data: commandInfo, guild_id: guildID, channel_id: channelID } = this.data;

    const guild = this.client.guilds.get(guildID) ?? (await this.client.guilds.fetch(guildID));
    const channel = this.client.channels.get(guildID) as AnyGuildTextableChannel ?? (await this.client.channels.fetch(channelID)) as unknown as AnyGuildTextableChannel;

    this.$refs = { guild, channel };
    if (!this.client.options.interactions) {
      this.shard.debug('Received interaction create event, it\'s not enabled.');
      return;
    }

    const globalCommands = await this.client.interactions!.getGlobalCommands();
    const guildCommands = await this.client.interactions!.getGuildCommands(guild.id);
    await this.client.interactions!.createInteractionResponse(this.data.id, this.token, 5);

    const command = globalCommands.find(c => c.id === commandInfo.id) || guildCommands.find(c => c.id === commandInfo.id);
    if (command === undefined) {
      this.shard.debug(`Received /${commandInfo.name} but it wasn't found.`);
      return;
    }

    this.$refs.command = command!;
    const { userMentions, roleMentions, content } = this._format();
    const allUsers = await Promise.all(userMentions.map(r => this.client.users.fetch(r)));

    this.$refs.message = new InteractionMessage(this.client, {
      timestamp: new Date().toISOString(),
      channel_id: this.channel.id,
      guild_id: this.guild.id,
      content,
      mention_roles: roleMentions,
      mentions: allUsers,
      token: this.data.token,
      author: {
        public_flags: this.member.user.flags,
        discriminator: this.member.user.discriminator,
        username: this.member.user.username,
        avatar: this.member.user.avatar,
        bot: this.member.user.bot,
        id: this.member.user.id
      }
    });
  }
}
