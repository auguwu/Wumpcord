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

/* eslint-disable camelcase */

const GuildMember = require('../../entities/GuildMember');
const Message = require('../../entities/Message');
const BaseEvent = require('../BaseEvent');

module.exports = class InteractionCreateEvent extends BaseEvent {
  /**
   * Returns the member who executed the command
   */
  get member() {
    return new GuildMember(this.client, this.data.member);
  }

  /**
   * Returns the interaction command executed
   * @returns {import('../../interactions/Command')} The interaction command
   */
  get command() {
    return this.$refs.command;
  }

  /**
   * Returns the token to use `InteractionCreateEvent.send()` and such
   * @returns {string}
   */
  get token() {
    return this.data.token;
  }

  /**
   * Returns the channel that the interaction was executed
   * @returns {import('../../').GuildTextableChannel}
   */
  get channel() {
    return this.$refs.channel;
  }

  /**
   * Returns the guild that the interaction was executed in
   * @returns {import('../../entities/Guild')}
   */
  get guild() {
    return this.$refs.guild;
  }

  async process() {
    const {
      data: commandInfo,
      guild_id: guildID,
      channel_id: channelID
    } = this.data;

    // get and cache them
    const guild = await this.client.guilds.fetch(guildID);
    const channel = await this.client.channels.fetch(channelID);

    // create a reference object
    this.$refs = { guild, channel };

    // now we do the interaction stuff here
    if (!this.client.options.interactions) {
      this.shard.debug('Received interaction create event, since it\'s not enabled: skipping.');
      return;
    }

    // cache them (if needed)
    await this.client.interactions.getGlobalCommands();
    await this.client.interactions.getGuildCommands(guild.id);

    // get the command by the cache id
    const command = this.client.interactions.commands.get(commandInfo.id);
    if (!command) {
      this.shard.debug(`Received /${commandInfo.name} but it's not cached, did it get deleted?`);
      return;
    }

    this.$refs.command = command;

    // now we emit the interaction message event
    const { userMentions, roleMentions, content } = this._format();

    const message = new Message(this.client, {
      id: null,
      type: 0,
      timestamp: new Date().toISOString(),
      channel_id: this.channel.id,
      guild_id: this.guild.id,
      flags: 0,
      content,
      mention_everyone: false,
      mention_roles: roleMentions,
      mentions: userMentions,
      pinned: false,
      author: {
        public_flags: this.member.user.flags,
        discriminator: this.member.user.discriminator,
        username: this.member.user.username,
        avatar: this.member.user.avatar,
        bot: this.member.user.bot,
        id: this.member.user.id
      }
    });

    this.client.emit('interactionMessage', message);
  }

  /**
   * Formats the arguments of the command and returns them
   * @credit https://github.com/FurryBotCo/FurryBot/blob/master/src/events/rawWS.ts#L53
   */
  _format() {
    if (!this.command.options.length) return {
      roleMentions: [],
      userMentions: [],
      content: `/${this.command.name}`
    };

    const roleMentions = [];
    const userMentions = [];
    let content = `/${this.command.name}`;

    const format = (arg) => {
      if (arg.options && !arg.value)
        return `${arg.name} ${arg.options.map(format)}`;
      else {
        if (['member', 'user'].some(e => arg.name.startsWith(e))) {
          userMentions.push(arg.value);
          return `<@!${arg.value}>`;
        } else if (arg.name === 'channel') {
          return `<#${arg.value}>`;
        } else if (arg.name === 'role') {
          roleMentions.push(arg.value);
          return `<@&${arg.value}>`;
        } else {
          return arg.value;
        }
      }
    };

    this.command.options.forEach(option => {
      const choices = option.choices.length ? option.choices.map(choice => `${choice.name}: ${choice.value}`) : null;
      if (choices !== null) {
        content += ` ${choices.join(' ')}`;
        return;
      }

      content += ` ${format(option)}`;
    });

    return {
      roleMentions, userMentions, content
    };
  }
};
