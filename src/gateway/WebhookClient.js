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

const { UserAgent, WebhookTypes } = require('../Constants');
const { HttpClient } = require('@augu/orchid');
const RESTClient = require('../rest/RESTClient');
const Multipart = require('../util/Multipart');

// Credit: https://github.com/xXBuilderBXx/DNetPlus/blob/master/DNetPlus/Webhook/DiscordWebhookClient.cs#L36
const UrlRegex = /^.*(discord|discordapp)\.com\/api\/webhooks\/([\d]+)\/([a-z0-9_-]+)$/i;

module.exports = class WebhookClient {
  /**
   * Creates a new [WebhookClient] instance
   * @param {string} idOrUrl The webhook ID or URL
   * @param {string} [token] The webhook's token
   */
  constructor(idOrUrl, token) {
    this.constructor._validate(idOrUrl, token);

    /**
     * If this webhook is deleted or not
     * @type {boolean}
     */
    this.deleted = false;

    /**
     * The constructed URL
     * @type {string}
     */
    this.url = UrlRegex.test(idOrUrl) ? idOrUrl : `https://discord.com/api/webhooks/${idOrUrl}/${token}`;

    /**
     * The HTTP client to send requests to
     * @type {HttpClient}
     */
    this.http = new HttpClient({
      agent: UserAgent,
      defaults: {
        baseUrl: this.url,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    /**
     * The rest client to create rest calls
     * @type {RESTClient}
     */
    this.rest = new RESTClient();

    /**
     * The ID of the webhook
     * @type {string}
     */
    this.id = UrlRegex.test(idOrUrl) ? (idOrUrl.match(UrlRegex))[2] : idOrUrl;

    /**
     * The token of the webhook
     * @type {string}
     */
    this.token = UrlRegex.test(idOrUrl) ? (idOrUrl.match(UrlRegex))[3] : token;
  }

  /**
   * Patches this [WebhookClient] with data
   * @param {WebhookPacket} data The data
   */
  patch(data) {
    /**
     * The webhook type
     * @type {?string}
     */
    this.type = WebhookTypes[data.type];

    /**
     * The webhook's name
     * @type {string}
     */
    this.name = data.name;

    /**
     * The avatar UUID
     * @type {?string}
     */
    this.avatar = data.avatar;

    /**
     * The channel ID the webhook belongs to
     * @type {string}
     */
    this.channelID = data.channel_id;

    /**
     * The guild ID the webhook belongs to
     * @type {string}
     */
    this.guildID = data.guild_id;

    /**
     * The user object
     * @type {PartialUserPacket}
     */
    this.user = data.user;
  }

  /**
   * Gets the webhook's current information and patches it to this [WebhookClient]
   *
   * @warning Only call this if you want metadata of the webhooh
   * @returns {Promise<this>} Returns this instance
   */
  get() {
    if (this.deleted) throw new TypeError('This [WebhookClient] has been disposed and aren\'t allowed to call REST endpoints');
    return this.rest.dispatch({
      endpoint: `/webhooks/${this.id}`,
      method: 'GET'
    }).then(data => {
      this.patch(data);
      return this;
    }).catch(() => this);
  }

  /**
   * Edits this [WebhookClient]
   * @param {{ name?: string; avatar?: string; channelID?: string; }} [options] The options to use
   * @returns {Promise<this>} Returns this instance
   */
  edit(options) {
    if (this.deleted) throw new TypeError('This [WebhookClient] has been disposed and aren\'t allowed to call REST endpoints');
    if (!options) throw new TypeError('Missing `options` object');
    if (typeof options !== 'object') throw new TypeError(`Expected \`object\`, received ${typeof options}`);

    if (options.avatar) throw new SyntaxError('`avatar` is not available to be edited at this time');
    if (options.name && typeof options.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.name}`);
    if (options.channelID && typeof options.channelID !== 'string') throw new TypeError(`Expected \`string\`, received ${typeof options.channelID}`);

    return this.rest.dispatch({
      endpoint: `/webhooks/${this.id}`,
      method: 'PATCH',
      data: {
        channel_id: options.channelID, // eslint-disable-line camelcase
        name: options.name
      }
    }).then(data => {
      this.patch(data);
      return this;
    }).catch(() => this);
  }

  /**
   * Deletes this webhook and not allowed to call rest endpoints
   * @returns {Promise<void>}
   */
  delete() {
    return this.rest.dispatch({
      endpoint: `/webhooks/${this.id}/${this.token}`,
      method: 'DELETE'
    }).then(() => {
      this.deleted = true;
    });
  }

  /**
   * Sends a message to the webhook's channel
   * @param {string | CreateMessageOptions | Buffer | MessageFile} content The content to send
   * @param {CreateMessageOptions | Buffer | MessageFile} [options] Any additional options
   * @returns {Promise<void>}
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
        if (!options.file) throw new SyntaxError('Missing "file" property in [options] (WebhookClient#send)');
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

    return this.rest.dispatch({
      endpoint: `/webhooks/${this.id}/${this.token}?wait=true`,
      method: 'POST',
      data: {
        allowed_mentions: send.allowed_mentions, // eslint-disable-line camelcase
        content: send.content,
        embeds: [send.embed] // TODO: add multiple embed support
      }
    });
  }
};

/**
 * @typedef {object} WebhookPacket
 * @prop {string} name
 * @prop {number} type
 * @prop {string} channel_id
 * @prop {string} token
 * @prop {?string} avatar
 * @prop {string} guild_id
 * @prop {string} id
 * @prop {PartialUserPacket} user
 *
 * @typedef {object} PartialUserPacket
 * @prop {string} username
 * @prop {string} discriminator
 * @prop {string} id
 * @prop {?string} avatar
 */
