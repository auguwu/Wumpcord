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

const BaseChannel = require('../../../entities/BaseChannel');

/**
 * Function to call when a channel has been created in a guild
 * @type {import('..').EventCallee}
 */
const onChannelDelete = function ({ d: data }) {
  if (!this.client.canCache('guild')) {
    this.debug('Can\'t cache guilds, emitting partial data anyway');
    this.client.emit('channelDelete', BaseChannel.from(this.client, data));
    return;
  }

  if (!this.client.canCache('channel')) {
    this.debug('Can\'t cache channels, emitting partial data anyway');
    this.client.emit('channelDelete', BaseChannel.from(this.client, data));
    return;
  }

  const guild = this.client.guilds.get(data.guild_id);
  if (!guild) {
    this.debug(`Guild "${data.guild_id}" is possibly uncached, emitting data anyway`);
    this.client.emit('channelDelete', BaseChannel.from(this.client, data));
    return;
  }

  const channel = BaseChannel.from(this.client, data);
  if (guild.channels.has(channel.id)) guild.channels.delete(channel.id);

  this.client.emit('channelDelete', channel);
};

module.exports = onChannelDelete;
