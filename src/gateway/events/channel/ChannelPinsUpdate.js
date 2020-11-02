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

/**
 * Function to call when a channel has uploaded/deleted a pin
 * @type {import('..').EventCallee}
 */
const onChannelPinsUpdate = function ({ d: data }) {
  if (!this.client.canCache('guild')) {
    this.debug('Can\'t cache guilds, not emitting anything');
    return;
  }

  if (!this.client.canCache('channel')) {
    this.debug('Can\'t cache channels, not emitting anything');
    return;
  }

  const guild = this.client.guilds.get(data.guild_id);
  if (!guild) {
    this.debug(`Guild "${data.guild_id}" is possibly uncached, not emitting anything`);
    return;
  }

  /** @type {import('../../entities/channel/TextChannel')} */
  const channel = guild.channels.get(data.channel_id);
  if (!channel || channel.type !== 'text') {
    this.debug(`Channel "${data.channel_id}" is not cached or it's not a text channel, not emitting anything`);
    return;
  }

  const oldTimestamp = channel.lastPinTimestamp;
  channel.lastPinTimestamp = data.last_pin_timestamp === null ? null : new Date(data.last_pin_timestamp);
  guild.channels.add(channel);

  this.client.emit('channelPinsUpdate', channel, oldTimestamp, channel.lastPinTimestamp);
};

module.exports = onChannelPinsUpdate;
