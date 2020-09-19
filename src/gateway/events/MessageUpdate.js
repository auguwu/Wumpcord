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
 * Function to call when a message is deleted
 * @type {import('.').EventCallee}
 */
const onMessageUpdate = function ({ d: data }) {
  if (!this.client.canCache('channel')) {
    this.debug('Received `messageUpdate` but channel cache is not enabled, still emitting with partial ID');
    this.client.emit('messageUpdate', null, { id: data.id });
    return;
  }

  if (!this.client.canCache('message')) {
    this.debug('Received `messageUpdate` but message cache is not enabled, still emitting with partial ID');
    this.client.emit('messageUpdate', null, { id: data.id });
    return;
  }

  const channel = this.client.channels.get(data.channel_id);
  if (!channel || channel.type !== 'text') {
    this.debug('Channel is possibly uncached or it\'s not a text channel, skipping');
    return;
  }

  const message = channel.messages.get(data.id);
  if (!message) {
    this.debug('Message is possibly not cached, emitting with partial ID');
    this.client.emit('messageUpdate', null, { id: data.id });
    return;
  }

  message.patch(data);
  this.client.emit('messageUpdate', message, message.edits[0]);
};

module.exports = onMessageUpdate;
