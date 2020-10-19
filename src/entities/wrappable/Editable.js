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
const Multipart = require('../../util/Multipart');
const Message = require('../Message');

/**
 * Gets the content data for sending/editing messages
 * @param {import('../../gateway/WebSocketClient')} client The WebSocket client to use
 * @param {string | import('./TextableChannel').CreateMessageOptions | import('../../').MessageFile[]} content The content itself or an options object
 * @param {import('./TextableChannel').CreateMessageOptions | import('../../').MessageFile[]} [options] The options object to use
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

      if (content.hasOwnProperty('content')) data.content = content.content;
      if (content.hasOwnProperty('embed')) data.embed = resolveEmbed(content.embed);
      if (content.hasOwnProperty('mentions')) data.allowed_mentions = Util.formatAllowedMentions(client.options.allowedMentions, content.mentions); // eslint-disable-line camelcase
    }
  } else {
    throw new TypeError('No content, file or embed was passed');
  }

  return {
    data,
    headers
  };
};

module.exports = class Editable {
  /**
   * Decorates a class with the `edit` method
   * @param {any} klazz The class to edit it
   */
  static decorate(klazz) {
    const props = ['edit'];
    for (let i = 0; i < props.length; i++) {
      Object.defineProperty(klazz.prototype, props[i], Object.getOwnPropertyDescriptor(this.prototype, props[i]));
    }

    return klazz;
  }

  /**
   * Edits a message
   * @param {string | import('./TextableChannel').CreateMessageOptions | import('../../').MessageFile[]} content The content to edit
   * @param {import('./TextableChannel').CreateMessageOptions | import('../../').MessageFile[]} [options] The options to use
   * @returns {Promise<Message>} Returns the new [Message] that was edited
   * or a REST error if anything occurs
   */
  edit(content, options) {
    const { data } = getContent(this.client, content, options);
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.message(this.channel ? this.channel.id : this.channelID, this.id),
      method: 'patch',
      data
    }).then(data => new Message(this.client, data));
  }
};
