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

const { WebhookTypes } = require('../Constants');
const PartialChannel = require('./partial/Channel');
const PartialGuild = require('./partial/Guild');
const DynamicImage = require('./wrappable/DynamicImage');
const Base = require('./Base');
const NotImplementedError = require('../exceptions/NotImplementedError');
const Util = require('../util/Util');
const Multipart = require('../util/Multipart');

class Webhook extends Base {
  /**
   * Creates a new [Webhook] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   * @param {import('discord-api-types/v8').APIWebhook} data The data supplied
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client instance
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches the data for this [Webhook] instance
   * @param {import('discord-api-types/v8').APIWebhook} data The data from Discord
   */
  patch(data) {
    /**
     * The type of webhook
     * @type {string}
     */
    this.type = WebhookTypes[data.type];

    /**
     * The name of the webhook
     * @type {string}
     */
    this.name = data.name;

    /**
     * The avatar of the webhook
     * @type {?string}
     */
    this.avatar = data.avatar;

    /**
     * The user who created the webhook
     * @type {import('./User')}
     */
    this.user = new (require('./User'))(this.client, data.user);

    /**
     * The channel that created the webhook
     * @type {?string}
     */
    this.channelID = data.channel_id;

    /**
     * The guild that hold this webhook
     * @type {?string}
     */
    this.guildID = data.guild_id;

    /**
     * The webhook's token
     * @type {string}
     */
    this.token = data.token;

    if (data.source_guild !== undefined) {
      /**
       * The source guild that the announcement channel
       * is created in.
       *
       * @type {import('./partial/PartialGuild')}
       */
      this.sourceGuild = new PartialGuild(this.client, data.source_guild);
    }

    if (data.source_channel !== undefined) {
      /**
       * The announcement channel that the user followed
       * @type {import('./partial/PartialChannel')}
       */
      this.sourceChannel = new PartialChannel(this.client, data.source_channel);
    }
  }

  /**
   * Fetches new data and populates this [Webhook] instance with it
   * @returns {Promise<this>}
   */
  fetch() {
    return this.client.rest.dispatch({
      endpoint: `/webhooks/${this.id}`,
      method: 'get'
    }).then(data => {
      this.patch(data);
      return this;
    });
  }

  /**
   * Modifys this [Webhook] with new data and returns it
   * @param {ModifyWebhookOptions} opts The options to use
   */
  modify(opts) {
    if (!opts) throw new TypeError('Missing `opts` object');
    if (typeof opts !== 'object' && !Array.isArray(opts)) throw new TypeError(`Expected \`object\`, but received ${typeof opts === 'object' ? 'array' : typeof opts}`);
    if (!Object.keys(opts).length) throw new TypeError('Can\'t pass in an empty object');

    if (opts.image) throw new NotImplementedError('Webhook', 'modify({ image: \'...\' })');
    if (opts.name && typeof opts.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof opts.name}`);
    if (opts.channelID && typeof opts.channelID !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof opts.channelID}`);

    return this.client.rest.dispatch({
      endpoint: `/webhooks/${this.id}`,
      method: 'patch',
      data: {
        channel_id: opts.channelID, // eslint-disable-line
        name: opts.name
      }
    }).then(data => {
      this.patch(data);
      return this;
    });
  }

  /**
   * Sends a message to the webhook's channel
   * @param {string | SendMessageOptions} content The content to send
   * @param {SendMessageOptions} [options] Any additional options to use
   */
  send(content, options) {
    if (this.token === undefined) throw new TypeError('Missing `token` variable in this [Webhook] class.');

    const { url, data, headers } = this._transformOptions(content, options);
    return this.client.rest.dispatch({
      endpoint: url,
      headers,
      method: 'post',
      data
    });
  }

  /**
   * Transforms the options for [Webhook.send],
   * this is an internal function and shouldn't be used elsewhere.
   *
   * @param {string | SendMessageOptions | import('..').MessageFile | Array<import('..').MessageFile>} content The content to send
   * @param {SendMessageOptions} [options] Any additional options
   * @returns {{ data: any; url: string; headers?: { [x: string]: any } }} Returns the data that was transformed
   */
  _transformOptions(content, options) {
    let send = {};
    const headers = {};

    if (typeof content === 'string' && options === undefined) {
      return {
        headers: {},
        data: { content },
        url: `/webhooks/${this.id}/${this.token}?wait=true`
      };
    }

    if (typeof content === 'object') {
      if (Array.isArray(content)) {
        if (content.some(x => !Util.isMessageFile(x))) {
          const filtered = content.filter(x => !Util.isMessageFile(x));
          throw new TypeError(`${filtered.length} item(s) were not a instance of [MessageFile]`);
        }

        const data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;
        for (let i = 0; i < content.length; i++) {
          const file = content[i];
          if (!file.file) continue;

          const name = file.name || 'file.png';
          data.append(name, file.file, name);
        }

        send = data.finish();
      }

      if (Util.isMessageFile(content)) {
        const data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;

        if (!content.file) throw new TypeError('Missing `file` in [MessageFile], under Webhook#send.');

        const name = content.name || 'file.png';
        data.append(name, content.file, name);
      }

      const available = ['content', 'embeds', 'avatarUrl', 'username', 'file', 'allowedMentions'];
      const populated = [];

      for (let i = 0; i < available.length; i++) {
        if (Object.hasOwnProperty.call(send, available[i])) {
          populated.push(available[i]);
        }
      }

      if (populated.length) throw new TypeError(`Properties ${available.join(', ')} are already populated`);
      if (content.hasOwnProperty('avatarUrl')) send.avatar_url = data.avatarUrl; // eslint-disable-line
      if (content.hasOwnProperty('username')) send.username = data.username;
      if (content.hasOwnProperty('mentions')) send.allowed_mentions = Util.formatAllowedMentions(this.client.options.allowedMentions, content.allowed_mentions); // eslint-disable-line
      if (content.hasOwnProperty('content')) send.content = content.content;
      if (content.hasOwnProperty('embeds')) send.embeds = content.embeds;
      if (content.hasOwnProperty('tts')) send.tts = Boolean(content.tts);
    } else if (typeof options === 'object') {
      if (Array.isArray(content)) {
        if (content.some(x => !Util.isMessageFile(x))) {
          const filtered = content.filter(x => !Util.isMessageFile(x));
          throw new TypeError(`${filtered.length} item(s) were not a instance of [MessageFile]`);
        }

        const data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;
        for (let i = 0; i < content.length; i++) {
          const file = content[i];
          if (!file.file) continue;

          const name = file.name || 'file.png';
          data.append(name, file.file, name);
        }

        send = data.finish();
      }

      if (Util.isMessageFile(content)) {
        const data = new Multipart();
        headers['Content-Type'] = `multipart/form-data; boundary=${multipart.boundary}`;

        if (!content.file) throw new TypeError('Missing `file` in [MessageFile], under Webhook#send.');

        const name = content.name || 'file.png';
        data.append(name, content.file, name);
      }

      const available = ['content', 'embeds', 'avatarUrl', 'username', 'file', 'allowedMentions'];
      const populated = [];

      for (let i = 0; i < available.length; i++) {
        if (Object.hasOwnProperty.call(send, available[i])) {
          populated.push(available[i]);
        }
      }

      if (populated.length) throw new TypeError(`Properties ${available.join(', ')} are already populated`);
      if (options.hasOwnProperty('avatarUrl')) send.avatar_url = data.avatarUrl; // eslint-disable-line
      if (options.hasOwnProperty('username')) send.username = data.username;
      if (options.hasOwnProperty('mentions')) send.allowed_mentions = Util.formatAllowedMentions(this.client.options.allowedMentions, options.mentions); // eslint-disable-line
      if (options.hasOwnProperty('content')) send.content = content.content;
      if (options.hasOwnProperty('embeds')) send.embeds = content.embeds;
      if (options.hasOwnProperty('tts')) send.tts = Boolean(content.tts);
    }

    const shouldWait = content.hasOwnProperty('wait') && typeof content.wait === 'boolean'
      ? content.wait
      : options && options.hasOwnProperty('wait') && typeof options.wait === 'boolean'
        ? options.wait
        : true;

    return {
      data: send,
      headers,
      url: `/webhooks/${this.id}/${this.token}?wait=${shouldWait ? 'true' : 'false'}`
    };
  }
}

DynamicImage.decorate(Webhook, ['avatar']);
module.exports = Webhook;

/**
 * @typedef {object} ModifyWebhookOptions
 * @prop {string} [channelID] The channel to move to
 * @prop {any} [image] The new avatar
 * @prop {string} name The name of the webhook
 *
 * @typedef {object} SendMessageOptions
 * @prop {string} [avatarUrl] The avatar URL to use
 * @prop {string} [username] The username to set the webhook as
 * @prop {import('../gateway/WebSocketClient').AllowedMentions} [mentions] Any allowed mentions to use
 * @prop {string} [content] The content to send
 * @prop {Array<import('./utilities/EmbedBuilder').Embed>} [embeds] List of embeds to display
 * @prop {boolean} [tts] If we should use the Text to Speech feature
 */
