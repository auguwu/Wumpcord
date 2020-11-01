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

const MessageCollectorManager = require('../managers/MessageCollectorManager');
const EmbedBuilder = require('../utilities/EmbedBuilder');
const Multipart = require('../../util/Multipart');
const Message = require('../Message');
const Util = require('../../util/Util');
const { Endpoints } = require('../../Constants');
const Constants = require('../../Constants');
const Permissions = require('../../util/Permissions');
const Webhook = require('../Webhook');

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
      if (options.hasOwnProperty('tts')) data.tts = options.tts;
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
      if (content.hasOwnProperty('tts')) data.tts = content.tts;
    }
  } else {
    throw new TypeError('No content, file or embed was passed');
  }

  return {
    data,
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
 */
class TextableChannel {
  /**
   * Decorates a class with the needed properties
   * @param {T} klazz The class to decorate
   * @param {DecorateOptions} options The options to decorate
   */
  static decorate(klazz, options) {
    options = Util.merge(options, {
      ignore: [],
      props: ['send'],
      full: false,
      send: true
    });

    if (options.send === false) options.props.splice(options.props.indexOf('send'), 1);

    const { full, props, ignore } = options;
    if (full) props.push(
      'getMessages',
      'bulkDelete',
      'startTyping',
      'stopTyping',
      'getTyping',
      'awaitMessages',
      'getPins',
      'addPin',
      'deletePin',
      'permissionsOf',
      'getWebhooks'
    );

    for (let i = 0; i < props.length; i++) {
      if (ignore.includes(props[i])) continue;
      Object.defineProperty(klazz.prototype, props[i], Object.getOwnPropertyDescriptor(this.prototype, props[i]));
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

  /**
   * Retrieves x amount of messages from this TextableChannel
   * @param {number} amount The amount to get
   * @param {GetMessagesOptions} options The options to use
   * @returns {Message[]} Returns an Array of messages
   * that was retrieved or a REST error of anything
   * occured.
   */
  getMessages(amount, options) {
    if (isNaN(amount)) throw new TypeError(`Amount "${amount}" was not a number`);
    if (amount < 2 || amount > 100) throw new TypeError('The amount must be lower/equal to 2 or higher/equal to 100');

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.messages(this.id),
      method: 'GET',
      data: {
        limit: amount,
        before: Util.get('before', undefined, options),
        after: Util.get('after', undefined, options),
        around: Util.get('around', undefined, options)
      }
    })
      .then(data => data.map(val => new Message(this.client, val)));
  }

  /**
   * Starts typing in a channel
   * @param {number} [count=1] How many times we should call [TextableChannel.startTyping]
   * @returns {Promise<void>} Returns a promise of nothing
   */
  startTyping(count = 1) {
    if (typeof count !== 'undefined' && count < 1) throw new RangeError('Typing count must be higher than 1');
    if (!this.client.canCache('typing')) return Promise.reject(new SyntaxError('User typings are not cachable'));

    if (this.client.typings.has(`${this.client.user.id}:${this.id}`)) {
      const entry = this.client.typings.get(this.id);
      entry.count = (count || entry.count) + 1;
      return entry.promise;
    }

    const entry = {};
    entry.promise = new Promise(async (resolve, reject) => {
      const dispatchCall = this.client.rest.dispatch({
        endpoint: Endpoints.Channel.typing(this.id),
        method: 'post'
      });

      Object.assign(entry, {
        interval: setInterval(async() => {
          try {
            await dispatchCall;
          } catch(ex) {
            clearInterval(entry.interval);
            this.client.typings.delete(`${this.client.user.id}:${this.id}`);
            return reject(ex);
          }
        }, 9000),
        resolve,
        count
      });

      try {
        await dispatchCall;
        this.client.typings.set(`${this.client.user.id}:${this.id}`, entry);
      } catch(ex) {
        clearInterval(entry.interval);
        this.client.typings.delete(`${this.client.user.id}:${this.id}`);
        return reject(ex);
      }
    });

    return entry.promise;
  }

  /**
   * Stops typing in a channel
   * @param {boolean} [force=true] If we should
   * force-close the typing indicator
   * @returns {void} Nothing.
   */
  stopTyping(force = true) {
    if (this.client.typings.has(`${this.client.user.id}:${this.id}`)) {
      const entry = this.client.typings.get(`${this.client.user.id}:${this.id}`);
      if (entry.count <= 0 || force) {
        clearInterval(entry.interval);
        this.client.typings.delete(`${this.client.user.id}:${this.id}`);
        return entry.resolve();
      }
    }
  }

  /**
   * Gets the typing of the bot or a user
   * @param {string} [userID] The user to get
   * @returns {import('../../gateway/WebSocketClient').UserTyping} Returns the typing instance
   */
  getTyping(userID) {
    const key = userID ? `${userID}:${this.id}` : `${this.client.user.id}:${this.id}`;
    return this.client.typings.get(key) || null;
  }

  /**
   * Awaits a new message passed by the filter
   * and returns the result if any or an error
   * on why the collector has failed to succeed.
   *
   * @param {string} userID The user's ID
   * @param {import('../utilities/MessageCollector').FilterFunction} filter The filter function
   * @param {number} [time=60000] The time to resolve this message
   */
  awaitMessages(userID, filter, time = 60) {
    if (!this.collector) {
      /**
       * The message collector for this [TextableChannel]
       * @type {MessageCollectorManager}
       */
      this.collector = new MessageCollectorManager(this.client, this);
    }

    return this.collector.createSession(userID, filter, { time });
  }

  /**
   * Sends a message to this [TextableChannel]
   * @param {string | CreateMessageOptions | import('../..').MessageFile[]} content The content to send
   * @param {CreateMessageOptions | import('../..').MessageFile[]} [options] The options to use
   * @returns {Promise<Message>} Returns a new [Message] instance
   * or a REST error if anything occured
   */
  async send(content, options) {
    if (this instanceof require('../user')) {
      const channel = await this.getDMChannel();
      return channel.send(content, options);
    }

    const { data, headers } = getContent(this.client, content, options);
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.messages(this.id),
      headers,
      method: 'POST',
      data
    }).then(data => new Message(this.client, data));
  }

  /**
   * Fetches the list of pins available
   * @returns {Promise<Array<Message>>} Returns an array of messages
   * or a REST error if anything occurs
   */
  getPins() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.pins(this.id),
      method: 'GET'
    }).then(data => data.map(msg => new Message(this.client, msg)));
  }

  /**
   * Adds a message to the pinned list
   * @param {Message} message The message to add
   * @returns {Promise<void>}
   */
  async addPin(message) {
    const pins = await this.getPins();
    if (pins.length > 50) throw new RangeError('Reached the maximum amount of pins.');

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.pin(this.id, message.id),
      method: 'PUT'
    });
  }

  /**
   * Deletes a message from the pinned list
   * @param {Message} message The message to remove
   * @returns {Promise<void>}
   */
  deletePin(message) {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.pin(this.id, message.id),
      method: 'DELETE'
    });
  }

  /**
   * Gets the [Permissions] instance of a member in this channel
   * @param {string} memberID The member's ID
   */
  async permissionsOf(memberID) {
    if (!this.guild) throw new Error(`Base "${this.constructor.name}" is not a Guild channel.`);

    /** @type {import('../GuildMember')} */
    let member;

    if (this.client.canCache && this.guild.members.has(memberID)) {
      member = this.guild.members.get(memberID);
    } else {
      member = await this.guild.fetchMember(memberID);
    }

    let permission = member.permission.allowed;
    if (permission & Constants.Permissions.administrator) return new Permissions(Constants.Permissions.all);

    let overwrite = this.permissionOverwrites.get(this.guild ? this.guildID : this.guildID);
    if (overwrite) permission = (permission & ~overwrite.permissions.denied) | overwrite.permissions.allowed;

    let deny = 0;
    let allow = 0;
    if (!this.client.canCache('overwrites')) return new Permissions(permission);

    for (const roleID of member.roles.keys()) {
      if ((overwrite = this.permissionOverwrites.get(roleID))) {
        deny |= overwrite.permissions.denied;
        allow |= overwrite.permissions.allowed;
      }
    }

    permission = (permission & ~deny) | allow;
    overwrite = this.permissionOverwrites.get(memberID);

    if (overwrite) permission = (permission & ~overwrite.permissions.denied) | overwrite.permissions.allowed;
    return new Permissions(permission);
  }

  /**
   * Gets a list of webhooks available in the channel
   * @returns {Promise<Webhook[]>} Returns an array of
   * Webhook objects or a REST error of anything occured
   */
  getWebhooks() {
    return this.client.rest.dispatch({
      endpoint: `/channels/${this.id}/webhooks`,
      method: 'get'
    }).then(data => data.map(d => new Webhook(this.client, d)));
  }
}

module.exports = TextableChannel;

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
 * @prop {boolean} [tts] If we should use Text to Speech
 *
 * @typedef {object} DecorateOptions
 * @prop {string[]} [ignore] The ignored properties
 * @prop {string[]} [props] The properties to pass down to the class
 * @prop {boolean} [full] If we should include all the properties that can be passed down
 * @prop {boolean} [send] If we should add `send` to the class
 */
