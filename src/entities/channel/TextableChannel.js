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
const BaseChannel = require('../BaseChannel');
const Multipart = require('../../util/Multipart');
const Message = require('../Message');
const Util = require('../../util/Util');

/**
 * Checks if an object is a [MessageFile] instance
 * @param {unknown} obj The object
 * @returns {obj is MessageFile} Returns a boolean value if it is or not
 */
const isMessageFile = (obj) => typeof obj === 'object' && !Array.isArray(obj) && obj.hasOwnProperty('file');

/**
 * Represents a "textable" channel, where this adds methods to
 * edit, send, delete, [un]pin messages in a Channel
 *
 * @template T The channel that it signifies as
 */
module.exports = class TextableChannel extends BaseChannel {
  /**
   * Creates a new [TextableChannel] instance
   * @param {import('../../gateway/WebSocketClient')} client The WebSocket client
   * @param {any} data The data
   */
  constructor(client, data) {
    super(data);

    /**
     * The client itself
     * @type {import('../../gateway/WebSocketClient')}
     * @private
     */
    this.client = client;
  }

  /**
   * Retrieves a message from this channel
   * @param {string} messageID The message ID
   * @returns {Promise<Message>}
   */
  getMessage(messageID) {
    return this.client.rest.dispatch({
      endpoints: Endpoints.Channel.message(this.id, messageID),
      method: 'get'
    })
      .then((data) => new Message(this.client, data))
      .catch(() => null);
  }

  /**
   * Closes this [DMChannel] instance and un-caches it, if possible
   * @returns {Promise<boolean>} Truthy value if it was left or not
   */
  close() {
    return this.client.rest.dispatch({
      endpoints: Endpoints.channel(this.id),
      method: 'delete'
    })
      .then(() => {
        if (this.client.canCache('channel')) {
          if (this.client.channels.has(this.id)) this.client.channels.delete(this.id);
          else this.client.emit('warn', `Possibly uncached channel: "${this.id}"`);
        }

        return true;
      }).catch(() => false);
  }

  /**
   * Get an Array of messages
   * @param {number} amount The amount of messages to receive
   * @param {GetMessagesOptions} [options] The options to use
   * @returns {Promise<Message[]>} Returns an Array of messages or an empty array if an REST error occured
   */
  getMessages(amount, options) {
    if (isNaN(amount)) throw new TypeError(`Amount "${amount}" was not a number`);
    if (amount < 2 || amount > 100) throw new TypeError('The amount must be lower/equal to 2 or higher/equal to 100');

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.messages(this.id),
      method: 'get',
      data: {
        limit: amount,
        before: Util.get('before', undefined, options),
        after: Util.get('after', undefined, options),
        around: Util.get('around', undefined, options)
      }
    })
      .then((data) => data.map(d => new Message(this.client, d)))
      .catch(() => []);
  }

  /**
   * Sends a message to a channel
   * @param {string | CreateMessageOptions | Buffer} content The content to send
   * @param {CreateMessageOptions | MessageFile[] | MessageFile} [options] Any additional options
   * @returns {Promise<import('../Message')>} The newly created message
   */
  send(content, options) {
    let send = {};
    const headers = {};
    let data;

    if (typeof content === 'string') {
      send = { content };
    } else if (typeof options === 'object') {
      // It's a file!
      if (Array.isArray(options)) {
        if (options.some(value => typeof value !== 'object')) {
          const items = options.filter(value => typeof value !== 'object');

          throw new SyntaxError(`${items.length} items were not a Buffer or an object`);
        }

        data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${data.boundary}`;

        for (let i = 0; i < options.length; i++) {
          const file = options[i];
          if (!file.file) return;
          if (!file.name) file.name = 'file.png';

          data.append(file.name, file.file, file.name);
        }

        send = data.finish();
      }

      if (isMessageFile(options)) {
        if (!options.file) throw new SyntaxError('Missing "file" property in [options] (DMChannel#send)');
        if (!options.name) options.name = 'file.png';

        data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${data.boundary}`;

        data.append(options.name, options.file, options.name);
        send = data.finish();
      } else {
        if (!options.hasOwnProperty('content') || send.hasOwnProperty('content')) throw new SyntaxError('Missing "content" in [MessageOptions] or `content` is already populated');

        // It's a normal object, let's just add it to `send`
        if (!send.hasOwnProperty('content') && options.hasOwnProperty('content')) send.content = options.content;
        if (options.hasOwnProperty('embed')) send.embed = options.embed;
        if (options.hasOwnProperty('allowedMentions')) {
          send.allowed_mentions = Util.formatAllowedMentions(this.client.options, options.allowedMentions); // eslint-disable-line camelcase
        }
      }
    } else if (typeof content === 'object') {
      // It's a file!
      if (Array.isArray(options)) {
        if (options.some(value => typeof value !== 'object')) {
          const items = options.filter(value => typeof value !== 'object');

          throw new SyntaxError(`${items.length} items were not a Buffer or an object`);
        }

        data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${data.boundary}`;

        for (let i = 0; i < options.length; i++) {
          const file = options[i];
          if (!file.file) return;
          if (!file.name) file.name = 'file.png';

          data.append(file.name, file.file, file.name);
        }

        send = data.finish();
      }

      if (isMessageFile(options)) {
        if (!options.file) throw new SyntaxError('Missing "file" property in [options] (TextableChannel#send)');
        if (!options.name) options.name = 'file.png';

        data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${data.boundary}`;

        data.append(options.name, options.file, options.name);
        send = data.finish();
      } else {
        if (send.hasOwnProperty('content')) throw new SyntaxError('`content` is already populated');

        // It's a normal object, let's just add it to `send`
        if (!send.hasOwnProperty('content') && content.hasOwnProperty('content')) send.content = content.content;
        if (content.hasOwnProperty('embed')) send.embed = content.embed;
        if (content.hasOwnProperty('allowedMentions')) {
          send.allowed_mentions = Util.formatAllowedMentions(client.options, content.allowedMentions); // eslint-disable-line camelcase
        }
      }
    } else {
      throw new SyntaxError('Missing content, file, or embed to send');
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.messages(this.id),
      method: 'post',
      data: send,
      headers
    })
      .then((data) => new Message(this.client, data));
  }

  /**
   * Pins a message to this [DMChannel]
   * @param {string} messageID The message ID
   */
  pin(messageID) {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.pin(this.id, messageID),
      method: 'PUT'
    })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Unpins a message from this [DMChannel]
   * @param {string} messageID The message ID
   */
  unpin() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.pin(this.id, messageID),
      method: 'DELETE'
    })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Fetches new data and returns it
   * @returns {Promise<T>} The channel with the new populated result
   */
  fetch() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.channel(this.id),
      method: 'GET'
    })
      .then((data) => {
        if (this.patch) this.patch(data);
        return this;
      }).catch(() => this);
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
 * @prop {import('../utilities/EmbedBuilder') | import('../utilities/EmbedBuilder').Embed} [embed] The embed to send
 * @prop {MessageFile} [file] The file to send
 *
 * @typedef {object} MessageFile
 * @prop {Buffer} file The file to send
 * @prop {string} [name] The filename
 */

