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

const GuildMember = require('../../../../entities/GuildMember');

/**
 * Function to call when a member has left a guild
 * @type {import('.').EventCallee}
 */
const onGuildMemberRemove = function ({ d: data }) {
  if (!this.client.canCache('guild')) {
    this.debug('Can\'t cache guilds, sending member data anyway');
    this.client.emit('guildMemberRemove', new GuildMember(this.client, data));
    return;
  }

  if (!this.client.canCache('member')) {
    this.debug('Can\'t cache members, sending member data anyway');
    this.client.emit('guildMemberRemove', new GuildMember(this.client, data));
    return;
  }

  const guild = this.client.guilds.get(data.guild_id);
  if (!guild) {
    this.debug(`Guild "${data.guild_id}" is possibly uncached, sending member data anyway`);
    this.client.emit('guildMemberRemove', new GuildMember(this.client, data));
    return;
  }

  const member = guild.members.get(data.user.id);
  if (!member) {
    this.debug(`Member "${data.user.id}" is possibly uncached, sending member data anyway`);
    this.client.emit('guildMemberRemove', new GuildMember(this.client, data));
    return;
  }

  const deleted = new GuildMember(this.client, data);
  guild.members.delete(deleted.id);
  this.client.emit('guildMemberRemove', deleted);
};

module.exports = onGuildMemberRemove;
