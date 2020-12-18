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

const BaseEvent = require('../BaseEvent');

/** @extends {BaseEvent<import('discord-api-types/v8').GatewayMessageDeleteDispatch['d']>} */
module.exports = class MessageDeleteEvent extends BaseEvent {
  get channel() {
    return this.$refs.channel;
  }

  get guild() {
    return this.$refs.guild;
  }

  get message() {
    return this.$refs.message;
  }

  async process() {
    const channel = await this.client.channels.fetch(this.data.channel_id);
    let guild = undefined;

    if (this.data.guild_id !== undefined) guild = await this.client.guilds.fetch(this.data.channel_id);

    this.$refs = {
      channel,
      guild,
      message: {
        id: this.data.id
      }
    };

    const message = channel.messages.get(this.data.id);
    if (!message) {
      this.shard.debug(`Missing message attributes, emitting with only ID (ID: ${this.data.id})`);
      return;
    }

    this.$refs.message = message;
  }
};
