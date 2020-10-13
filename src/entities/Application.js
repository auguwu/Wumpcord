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

const { CdnUrl } = require('../Constants');
const Team = require('./Team');
const Base = require('./Base');

module.exports = class OAuth2Application extends Base {
  /**
   * Creates a new [OAuth2Application] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {OAuth2ApplicationPacket} data The data supplied
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
   * Patches this [OAuth2Application] instance
   * @param {OAuth2ApplicationPacket} data The data
   */
  patch(data) {
    /**
     * The name of the application
     * @type {string}
     */
    this.name = data.name;

    /**
     * The avatar icon UUID
     * @type {?string}
     */
    this.icon = data.icon;

    /**
     * The description of the application
     * @type {?string}
     */
    this.description = data.description;

    /**
     * The summary of the application
     * @type {?string}
     */
    this.summary = data.summary;

    /**
     * If the bot is public or not
     * @type {boolean}
     */
    this.public = data.bot_public || false;

    /**
     * If the bot requires a `?code` property when inviting it
     * @type {boolean}
     */
    this.codeGrant = data.bot_require_code_grant || false;

    /**
     * The owner of the application
     * @type {?import('./User')}
     */
    this.owner = this.client.canCache('user')
      ? /team\d+/g.test(data.owner.username)
        ? null
        : this.client.users.get(data.owner.id) || new (require('./User'))(this.client, data.owner)
      : null;

    /**
     * The team that owns the application
     * @type {?import('./Team')}
     */
    this.team = data.team ? new Team(this.client, data.team) : null;

    if (data.primary_sku_id !== undefined) {
      /**
       * The primary SKU id
       * @type {?string}
       */
      this.primarySKU = data.primary_sku_id;
    }

    if (data.slug !== undefined) {
      /**
       * The slug ID
       * @type {?string}
       */
      this.slug = data.slug;
    }

    if (data.guild_id !== undefined) {
      /**
       * The guild that the application belongs in
       * @type {?import('./Guild')}
       */
      this.guild = this.client.canCache('guild')
        ? this.client.guilds.get(data.guild_id) || null
        : null;

      /**
       * The guild ID that the application belongs in
       * @type {?string}
       */
      this.guildID = data.guild_id;
    }

    if (data.cover_image !== undefined) {
      /**
       * The cover image UUID
       * @type {?string}
       */
      this.coverImage = data.cover_image;
    }

    if (data.rpc_origins !== undefined) {
      /**
       * The RPC origins
       * @type {string[]}
       */
      this.rpcOrigins = data.rpc_origins;
    }
  }

  /**
   * Gets the Icon URL if [Application.icon] is not null
   * @returns {string} The URL or `null` if it's empty
   */
  get iconUrl() {
    if (this.icon === null) return null;

    return `${CdnUrl}/app-icons/${this.id}/${this.icon}.png?size=1024`;
  }

  /**
   * Gets the Cover URl if [Application.cover] is not null
   * @returns {string} The URL or `null` if it's empty
   */
  get coverUrl() {
    if (!this.coverImage) return null;

    return `${CdnUrl}/app-icons/${this.id}/${this.coverImage}.png?size=1024`;
  }
};

/**
 * @typedef {object} OAuth2ApplicationPacket
 * @prop {string} id
 * @prop {string} name
 * @prop {string} [icon]
 * @prop {string} description
 * @prop {string} summary
 * @prop {string} [primary_sku_id]
 * @prop {string} [slug]
 * @prop {string} [guild_id]
 * @prop {string} [cover_image]
 * @prop {boolean} bot_public
 * @prop {boolean} bot_require_code_grant
 * @prop {import('./User').UserPacket} owner
 * @prop {TeamPacket} [team]
 * @prop {string[]} [rpc_origins]
 *
 * @typedef {object} TeamPacket
 * @prop {string} id
 * @prop {string} icon
 * @prop {string} name
 * @prop {string} owner_user_id
 * @prop {TeamMemberPacket[]} members
 *
 * @typedef {object} TeamMemberPacket
 * @prop {import('./User').UserPacket} user
 * @prop {string} team_id
 * @prop {number} membership_state
 * @prop {string[]} permissions
 */
