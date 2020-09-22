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
 * Function to call when a user starts typing in a channel
 * @type {import('.').EventCallee}
 */
const onTypingStart = function ({ d: data }) {
  if (
    !this.client.canCache('user') ||
    !this.client.canCache('typing') ||
    !this.client.canCache('channel')
  ) {
    this.debug('Unable to emit typingStart: Missing `user`, `typing` and `channel` cache');
    return;
  }

  const user = this.client.users.get(data.user_id) || { id: data.user_id };
  const channel = this.client.channels.get(data.channel_id) || { id: data.channel_id };

  if (channel.type && !['dm', 'text', 'news'].includes(channel.type)) {
    this.debug(`Unable to emit typingStart: Channel "${channel.id}" was not a Text, DM, or News channel`);
    return;
  }

  if (this.client.typings.has(`${user.id}:${channel.id}`)) {
    const typing = this.client.typings.get(`${user.id}:${channel.id}`);

    typing.lastTimestamp = new Date(data.timestamp * 1000);
    typing.elapsedTime = Date.now() - typing.since;
    typing.channel = channel;
    typing.user = user;
    clearTimeout(typing.timeout);
  } else {
    const since = new Date();
    const lastTimestamp = new Date();

    this.client.typings.set(`${user.id}:${channel.id}`, {
      channel,
      user,
      since,
      lastTimestamp,
      elapsedTime: Date.now() - since,
      timeout: setTimeout(() => this.client.typings.delete(`${user.id}:${channel.id}`), 10000)
    });

    this.client.emit('typingStart', channel, user);
  }
};

module.exports = onTypingStart;
