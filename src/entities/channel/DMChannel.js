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

const { Endpoints } = require('../../Constants');
const TextableChannel = require('./TextableChannel');
const Message = require('../Message');

/**
 * Represents a private channel with a user
 */
module.exports = class DMChannel extends TextableChannel {
  /**
   * Creates a new [DMChannel] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {any} data The data to use
   */
  constructor(client, data) {
    super(client, data);

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

    client.insert('user', this.recipient);
  }

  /**
   * Gets the last message, if specified
   * @returns {Promise<Message>} The message or `null` if can't be fetched
   */
  getLastMessage() {
    if (this.lastMessageID === null) return null;

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.message(this.id, this.lastMessageID),
      method: 'get'
    })
      .then((data) => new Message(this.client, data))
      .catch(() => null);
  }
};

/**
 * @typedef {object} GetMessagesOptions
 * @prop {number} [before] The before limit
 * @prop {number} [after] The after limit
 * @prop {number} [around] The around limit
 * 
 * @typedef {object} CreateMessageOptions
 * @prop {string} [content] The message content
 * @prop {import('../message/MessageEmbed') | import('../message/MessageEmbed').Embed} [embed] The embed to send
 * @prop {MessageFile} [file] The file to send
 * 
 * @typedef {object} MessageFile
 * @prop {Buffer} file The file to send
 * @prop {string} [name] The filename
 */
