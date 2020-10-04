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

const { Collection } = require('@augu/immutable');
const Base = require('./Base');

/**
 * Represents a Guild member
 */
module.exports = class GuildMember extends Base {
  /**
   * Creates a new [GuildMember] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {GuildMemberPacket} data The data
   */
  constructor(client, data) {
    super(data.user.id);

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * List of roles, if cachable
     * @type {Collection<Role>}
     */
    this.roles = client.canCache('member:role') ? new Collection() : null;

    this.patch(data);
  }

  /**
   * Patches this [GuildMember] instance
   * @param {GuildMemberPacket} data The data
   */
  patch(data) {
    /**
     * The user, if cached
     * @type {import('./User') | null}
     */
    this.user = this.client.canCache('user') ? this.client.users.get(data.user.id) : null;

    /**
     * Date when the user has booted
     * @type {Date}
     */
    this.boostedAt = data.premium_since ? new Date(data.premium_since) : null;

    /**
     * The nickname the user has set or `null` if none was set
     * @type {?string}
     */
    this.nick = data.nick || null;

    /**
     * If the user is globally muted
     * @type {boolean}
     */
    this.muted = data.mute;

    /**
     * If the user is globally deafened
     * @type {boolean}
     */
    this.deafend = data.deaf;

    /**
     * Date when the user joined the guild
     * @type {Date}
     */
    this.joinedAt = new Date(data.joined_at);

    /**
     * The user's hoisted role ID
     * @type {?string}
     */
    this.hoistedRoleID = data.hoisted_role || null;

    /**
     * The guild's ID
     * @type {?string}
     */
    this.guildID = data.guild_id; // we populate this, discord doesn't

    if (data.roles) {
      if (this.client.canCache('member:role') && this.client.canCache('guild')) {
        for (let i = 0; i < data.roles.length; i++) {
          const roleID = data.roles[i];
          const guild = this.client.guilds.get(this.guildID);

          if (guild) this.roles.set(roleID, guild.roles.get(roleID) || null);
        }
      }
    }
  }

  /**
   * Gets the hoisted role or `null` if not found
   */
  get hoistedRole() {
    return this.roles.get(this.hoistedRoleID) || null;
  }

  /**
   * Get's the cached guild or `null` if not cached
   */
  get guild() {
    return this.client.guilds.get(this.guildID) || null;
  }
};

/**
 * @typedef {object} GuildMemberPacket
 * @prop {PartialUser} user
 * @prop {string[]} roles
 * @prop {string} [premium_since]
 * @prop {string} [nick]
 * @prop {boolean} mute
 * @prop {string} joined_at
 * @prop {string} [hoisted_role]
 * @prop {boolean} deaf
 * @prop {string} guild_id
 *
 * @typedef {object} PartialUser
 * @prop {string} username
 * @prop {number} public_flags
 * @prop {string} id
 * @prop {string} discriminator
 * @prop {string} avatar
 */
