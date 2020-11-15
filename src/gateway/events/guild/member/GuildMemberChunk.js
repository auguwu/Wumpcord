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

const { Collection } = require('@augu/immutable');
const Presence = require('../../../../entities/Presence');

/**
 * Function to call when we receive a chunk of members
 * @type {import('.').EventCallee}
 */
const onGuildMemberChunk = function ({ d: data }) {
  if (!this.client.canCache('guild')) {
    this.client.emit('warn', 'Cannot do member chunk because possibly uncaching');
    return;
  }

  const guild = this.client.guilds.get(data.guild_id);
  if (!guild) {
    this.client.emit('warn', `Guild "${data.guild_id}" is possibly uncached, skipping`);
    return;
  }

  const members = new Collection();
  for (const member of data.members) {
    members.set(member.user.id, member);
    guild.members.add(member);
  }

  if (data.presences) {
    for (let i = 0; i < data.presences.length; i++) {
      guild.presences.add(new Presence(this.client, data.presences[i]));
    }
  }

  this.client.emit('guildMemberChunk', members, guild, {
    count: data.chunk_count,
    index: data.chunk_index,
    nonce: data.nonce
  });
};

module.exports = onGuildMemberChunk;
