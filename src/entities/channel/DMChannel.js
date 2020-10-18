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

const TextableChannel = require('../wrappable/TextableChannel');
const BaseChannel = require('../BaseChannel');

/**
 * Represents a private channel with a user
 */
class DMChannel extends BaseChannel {
  /**
   * Creates a new [DMChannel] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {any} data The data to use
   */
  constructor(client, data) {
    super(data);

    /**
     * The last message ID
     * @type {?string}
     */
    this.lastMessageID = data.last_message_id;

    /**
     * The user we are having a chat with
     * @type {import('../User')}
     */
    this.recipient = new (require('../User'))(this.client, data.recipients[0]);

    /**
     * The client that is passed in
     * @private
     */
    this.client = client;

    client.insert('user', this.recipient);
  }
}

TextableChannel.decorate(DMChannel, { full: true });
module.exports = DMChannel;
