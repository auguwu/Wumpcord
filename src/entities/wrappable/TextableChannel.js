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

const EmbedBuilder = require('../utilities/EmbedBuilder');
const Multipart = require('../../util/Multipart');
const Message = require('../Message');
const Util = require('../../util/Util');

/**
 * Gets the content data for sending/editing messages
 * @param {string | CreateMessageOptions | import('../../').MessageFile[]} content The content itself or an options object
 * @param {CreateMessageOptions | import('../../').MessageFile[]} [options] The options object to use
 */
// this is an internal function, so we don't need
// to validate `content` and `options`
const getContent = (content, options) => {
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
    }
  }
};

// re-work this
/*
    let send = {};
    const headers = {};
    let data;

    if (typeof content === 'string') {
      send = { content };
    } else if (typeof options === 'object') {
      // It's a file!
      if (Array.isArray(options)) {
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
*/

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
 */
