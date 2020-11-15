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
const GuildEmoji = require('../../../../entities/Emoji');

/**
 * Called when a guild has updated the emoji list
 * @type {import('../..').EventCallee}
 */
const onGuildEmojisUpdate = function ({ d: data }) {
  if (!this.client.canCache('guild')) {
    this.debug('Can\'t cache guilds, emitting partial data anyway');
    this.client.emit('guildEmojisUpdate', null, data.emojis.map(emoji => new GuildEmoji(this.client, emoji)));
    return;
  }

  if (!this.client.canCache('emoji')) {
    this.debug('Can\'t cache emojis, emitting partial data anyway');
    this.client.emit('guildEmojisUpdate', null, data.emojis.map(emoji => new GuildEmoji(this.client, emoji)));
    return;
  }

  const guild = this.client.guilds.get(data.guild_id);
  if (!guild) {
    this.debug(`Guild "${data.guild_id}" is possibly uncached, emitting partial data anyway`);
    this.client.emit('guildEmojisUpdate', null, data.emojis.map(emoji => new GuildEmoji(this.client, emoji)));
    return;
  }

  const oldEmojis = guild.emojis.cache; // keep old cache
  for (let i = 0; i < data.emojis.length; i++) {
    const emoji = data.emojis[i];
    const emote = new GuildEmoji(this.client, { guild_id: data.guild_id, ...emoji }); // eslint-disable-line
    guild.emojis.add(emote);
  }

  this.client.emit('guildEmojisUpdate', Array.from(oldEmojis.values()), data.emojis.map(emoji => new GuildEmoji(this.client, emoji)));
};

module.exports = onGuildEmojisUpdate;
