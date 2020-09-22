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

const { Message } = require('../../../entities');

/**
 * Received when a message has been created
 * @type {import('..').EventCallee}
 */
const onMessageCreate = async function ({ d: data }) {
  const message = new Message(this.client, data);
  const channel = await message.getChannel();

  if (channel !== null && channel.type === 'text') {
    if (!this.client.canCache('message')) this.debug('Can\'t cache messages, `messageDelete` and `messageUpdate` will only emit partial IDs');
    if (!this.client.canCache('channel')) this.debug('Can\'t cache channels, `messageDelete` and `messageUpdate` will only emit partial IDs');
    if (this.client.canCache('message')) channel.messages.addFirst(message);

    message.patch(data);
  }

  this.client.emit('message', message);
};

module.exports = onMessageCreate;
