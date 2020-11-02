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

const Message = require('../entities/Message');
const BaseStore = require('./BaseStore');

/**
 * @extends {BaseStore<Message>}
 */
module.exports = class ChannelMessageStore extends BaseStore {
  /**
   * Represents a store to hold channels
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   */
  constructor(client) {
    super(
      client,
      Message,
      client.canCache('message'),
      true
    );
  }

  /**
   * Fetches a message from Discord and possibly caches it
   * @param {string} channelID The channel's ID
   * @param {string} messageID The message's ID
   */
  fetch(channelID, messageID) {
    return this
      .client
      .getMessage(channelID, messageID)
      .then(message => this.add(message));
  }
};
