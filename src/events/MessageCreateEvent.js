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

const BaseEvent = require('./BaseEvent');
const Message = require('../entities/Message');

/** @extends {BaseEvent<import('discord-api-types/v8').GatewayMessageCreateDispatch['d']>} */
module.exports = class MessageCreateEvent extends BaseEvent {
  /**
   * Gets and caches the channel the message is in
   * @returns {Promise<import('..').TextableChannel>}
   */
  getChannel() {
    return this.client.channels.fetch(this.data.channel_id);
  }

  /**
   * Gets and caches the guild the message is in
   * @returns {Promise<import('../entities/Guild')>}
   */
  getGuild() {
    if (!this.data.guild_id) throw new Error('[guild_id] was not populated.');

    return this.client.guilds.fetch(this.data.guild_id);
  }

  get() {
    return new Message(this.client, this.data);
  }

  async process() {
    const message = this.get();
    const channel = await this.getChannel(); // cache it

    if (channel !== null && channel.type === 'text') {
      message.patch(this.data);
      channel.messages.add(message);

      this.client.channels.cache.set(channel.id, channel);
    }

    try {
      await this.getGuild();
    } catch {
      // noop
    }
  }
};
