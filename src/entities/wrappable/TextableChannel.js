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

const ReactionCollector = require('../utilities/ReactionCollector');
const MessageCollector = require('../utilities/MessageCollector');
const EmbedBuilder = require('../utilities/EmbedBuilder');
const Multipart = require('../../util/Multipart');
const Message = require('../Message');
const Util = require('../../util/Util');
const { Endpoints } = require('../../Constants');

/**
 * Gets the content data for sending/editing messages
 * @param {import('../../gateway/WebSocketClient')} client The WebSocket client to use
 * @param {string | CreateMessageOptions | import('../../').MessageFile[]} content The content itself or an options object
 * @param {CreateMessageOptions | import('../../').MessageFile[]} [options] The options object to use
 */
// this is an internal function, so we don't need
// to validate `content` and `options`
const getContent = (client, content, options) => {
  let data = {};
  const headers = {};
  let multipart;

  if (typeof content === 'string') data = { content };
  else if (options && typeof options === 'object') {
    // We received a file array, let's parse it
    if (Array.isArray(options)) {
      if (options.some(Util.isMessageFile)) {
        const items = options.filter(Util.isMessageFile);

        // yeams :froger:
        throw new SyntaxError(`${items.length} items weren't a Buffer or an object`);
      }

      multipart = new Multipart();
      headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;
      for (let i = 0; i < options.length; i++) {
        const file = options[i];
        if (!file.file) continue;

        const name = file.name || 'file.png';
        multipart.append(name, file.file, name);
      }

      data = multipart.finish();
    } else if (Util.isMessageFile(options)) {
      const name = options.name || 'file.png';
      multipart = new Multipart();
      headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;

      multipart.append(name, options.file, name);
      data = multipart.finish();
    } else {
      if (Object.hasOwnProperty.call(data, 'content')) throw new TypeError('Property "content" is already populated');

      if (options.hasOwnProperty('content')) data.content = options.content;
      if (options.hasOwnProperty('embed')) data.embed = resolveEmbed(options.embed);
      if (options.hasOwnProperty('mentions')) data.allowed_mentions = Util.formatAllowedMentions(client.options.allowedMentions, options.mentions); // eslint-disable-line camelcase
    }
  } else if (typeof content === 'object') {
    // We received a file array, let's parse it
    if (Array.isArray(options)) {
      if (content.some(Util.isMessageFile)) {
        const items = options.filter(Util.isMessageFile);

        // yeams :froger:
        throw new SyntaxError(`${items.length} items weren't a Buffer or an object`);
      }

      multipart = new Multipart();
      headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;
      for (let i = 0; i < options.length; i++) {
        const file = options[i];
        if (!file.file) continue;

        const name = file.name || 'file.png';
        multipart.append(name, file.file, name);
      }

      data = multipart.finish();
    } else if (Util.isMessageFile(content)) {
      const name = content.name || 'file.png';
      multipart = new Multipart();
      headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;

      multipart.append(name, options.file, name);
      data = multipart.finish();
    } else {
      if (Object.hasOwnProperty.call(data, 'content')) throw new TypeError('Property "content" is already populated');

      if (content.hasOwnProperty('content')) data.content = options.content;
      if (content.hasOwnProperty('embed')) data.embed = resolveEmbed(options.embed);
      if (content.hasOwnProperty('mentions')) data.allowed_mentions = Util.formatAllowedMentions(client.options.allowedMentions, options.mentions); // eslint-disable-line camelcase
    }
  } else {
    throw new TypeError('No content, file or embed was passed');
  }

  return {
    data,
    multipart,
    headers
  };
};

/**
 * Resolves a [Embed] from a builder or an object
 * @param {EmbedBuilder | import('../utilities/EmbedBuilder').Embed} value The value
 * @returns {import('../utilities').Embed} The embed itself
 */
const resolveEmbed = (value) => {
  if (value instanceof EmbedBuilder) return value.build();
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  throw new TypeError(`Expecting \`object\` or \`EmbedBuilder\`, but received ${typeof value}`);
};

/**
 * Represents a textable channel with methods like `send`.
 *
 * Use `TextableChannel.decorate/3` to decorate a channel with the functions available
 * @template T The channel generic
 */
module.exports = class TextableChannel {
  /**
   * Decorates a class with the needed properties
   * @param {T} klazz The class to decorate
   * @param {DecorateOptions} options The options to decorate
   */
  static decorate(klazz, options) {
    options = Util.merge(options, {
      ignore: [],
      props: ['send'],
      full: false
    });

    const { full, props, ignore } = options;
    if (full) props.push(
      'getMessages',
      'bulkDelete',
      'startTyping',
      'stopTyping',
      'getTypingCount',
      'awaitMessages',
      'awaitReactions',
      'createReactionCollector',
      'createMessageCollector'
    );

    for (let i = 0; i < props.length; i++) {
      if (ignore.includes(props[i])) continue;
      Object.defineProperty(klazz.prototype, props[i], Object.getOwnPropertyDescriptor(TextableChannel.prototype, props[i]));
    }
  }

  /**
   * Deletes mutiple messages at once
   * @param {Array<string | Message>} messageIDs The message IDs to collect
   * @returns {string[]}
   */
  async bulkDelete(messageIDs) {
    /** @type {import('../../gateway/WebSocketClient')} */
    const client = this.client;

    if (Array.isArray(messageIDs)) {
      if (messageIDs.some(val => typeof val !== 'string' || !(val instanceof Message))) {
        const items = messageIDs.filter(val => typeof val !== 'string' || !(val instanceof Message));
        throw new TypeError(`${items.length} were not an instanceof \`Message\` or not a string`);
      }

      const messages = messageIDs.map(value => value instanceof Message ? value.id : value);
      if (!messages.length) return 0;
      if (messages.length === 1) return client.rest.dispatch({
        endpoint: Endpoints.Channel.message(this.id, messages[0]),
        method: 'DELETE'
      }).then(() => 1);

      await client.rest.dispatch({
        endpoint: Endpoints.Channel.bulkDelete(this.id),
        method: 'POST',
        data: {
          messages
        }
      });

      return messages.length;
    } else {
      throw new TypeError(`Expecting \`array\`, but gotten ${typeof messageIDs}`);
    }
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
 * @typedef {object} DecorateOptions
 * @prop {string[]} [ignore] The ignored properties
 * @prop {string[]} [props] The properties to pass down to the class
 * @prop {boolean} [full] If we should include all the properties that can be passed down
 */
