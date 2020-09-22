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
const onMessageDelete = function ({ d: data }) {
  if (!this.client.canCache('channel')) {
    this.debug('Can\'t cache channels, will emit `messageDelete` with it\'s ID');
    this.client.emit('messageDelete', { id: data.id });
    return;
  }

  if (!this.client.canCache('message')) {
    this.debug('Can\'t cache messages, will emit `messageDelete` with it\'s ID');
    this.client.emit('messageDelete', { id: data.id });
    return;
  }

  /** @type {import('../../entities/channel/TextChannel')} */
  const channel = this.client.channels.get(data.channel_id);
  if (!channel || channel.type !== 'text') {
    this.debug('Channel is possibly uncached or it\'s not a text channel, skipping');
    return;
  }

  const message = channel.messages.find(m => m.id === data.id);
  if (!message) {
    this.debug('Message wasn\'t cached, will emit `messageDelete` with it\'s ID');
    this.client.emit('messageDelete', { id: data.id });
    return;
  }

  channel.messages.remove(message);
  this.client.emit('messageDelete', message);
};

module.exports = onMessageDelete;
