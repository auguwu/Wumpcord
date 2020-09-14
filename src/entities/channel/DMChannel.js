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

const { BaseChannel, User, Message } = require('..');
const { Collection } = require('@augu/immutable');
const { Endpoints } = require('../../Constants');
const Util = require('../../util/Util');

module.exports = class DMChannel extends BaseChannel {
  /**
   * Creates a new [DMChannel] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {any} data The data to use
   */
  constructor(client, data) {
    super(data);

    /**
     * The client
     * @private
     * @type {import('../../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The last message ID
     * @type {?string}
     */
    this.lastMessageID = data.last_message_id;

    if (data.recipients) {
      /**
       * The recipients of this DM channel
       * @type {Collection<User> | number}
       */
      this.recipients = client.canCache('user') ? new Collection() : 0;

      for (let i = 0; i < data.recipients.length; i++) {
        const recipient = data.recipients[i];
        const user = new User(recipient);

        if (client.canCache('user')) this.recipients.set(user.id, user);
        else this.recipients++;
      }
    }
  }

  /**
   * Gets the last message, if specified
   * @returns {Promise<Message>} The message or `null` if can't be fetched
   */
  async getLastMessage() {
    if (this.lastMessageID === null) return null;

    try {
      const data = await this.client.rest.dispatch({
        endpoint: Endpoints.Channel.message(this.id, this.lastMessageID),
        method: 'get'
      });

      return new Message(this.client, data);
    } catch(ex) {
      return null;
    }
  }

  /**
   * Retrieves a message from this channel
   * @param {string} messageID The message ID
   * @returns {Promise<Message>}
   */
  async getMessage(messageID) {
    try {
      const data = await this.client.rest.dispatch({
        endpoints: Endpoints.Channel.message(this.id, messageID),
        method: 'get'
      });

      return new Message(this.client, data);
    } catch(ex) {
      return null;
    }
  }

  /**
   * Leaves the channel and uncaches it
   * @returns {Promise<boolean>} Truthy value if it was left or not
   */
  async leave() {
    try {
      await this.client.rest.dispatch({
        endpoints: Endpoints.channel(this.id),
        method: 'delete'
      });

      if (this.client.canCache('channel')) {
        if (this.client.channels.has(this.id)) this.client.channels.delete(this.id);
        else this.client.emit('warn', `Possibly uncached channel: "${this.id}"`);
      } else {
        this.client.channels--;
      }
      
      return true;
    } catch(ex) {
      return false;
    }
  }

  /**
   * Get an Array of messages 
   * @param {number} amount The amount of messages to receive
   * @param {GetMessagesOptions} [options] The options to use
   * @returns {Promise<Message[]>} Returns an Array of messages or an empty array if an REST error occured
   */
  async getMessages(amount, options) {
    if (isNaN(amount)) throw new TypeError(`Amount "${amount}" was not a number`);
    if (amount < 2 || amount > 100) throw new TypeError('The amount must be lower/equal to 2 or higher/equal to 100');
    
    try {
      const messages = await this.client.rest.dispatch({
        endpoint: Endpoints.Channel.messages(this.id),
        method: 'get',
        data: {
          limit: amount,
          before: Util.get('before', undefined, options),
          after: Util.get('after', undefined, options),
          around: Util.get('around', undefined, options)
        }
      });

      return messages.map(data => new Message(client, data));
    } catch(ex) {
      return [];
    }
  }
};

/**
 * @typedef {object} GetMessagesOptions
 * @prop {number} [before] The before limit
 * @prop {number} [after] The after limit
 * @prop {number} [around] The around limit
 */
