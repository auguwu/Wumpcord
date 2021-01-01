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

const { Queue } = require('@augu/immutable');
const Emoji = require('../../../../entities/Emoji');

/**
 * Function to call when a reaction has been removed from a message
 * @type {import('../..').EventCallee}
 */
const onMessageReactionRemoved = function ({ d: data }) {
  if (
    !this.client.canCache('user') ||
    !this.client.canCache('message') ||
    !this.client.canCache('channel')
  ) {
    this.debug('Missing cache options, this event requires `user`, `message` and `channel` to be enabled');
    return;
  }

  /** @type {import('../../../../entities/channel/TextChannel')} */
  const channel = this.client.channels.get(data.channel_id) || { id: data.channel_id, messages: new Queue() };
  const message = channel.messages.find(msg => msg.id === data.message_id) || { id: data.message_id };
  const user = this.client.users.get(data.user_id) || { id: data.user_id };

  this.client.emit('messageReactionRemove', message, user, new Emoji(this.client, data.emoji));
};

module.exports = onMessageReactionRemoved;