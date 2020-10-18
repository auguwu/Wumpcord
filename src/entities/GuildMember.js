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
const TextableChannel = require('./wrappable/TextableChannel');
const Base = require('./Base');

/**
 * Represents a Guild member
 */
class GuildMember extends Base {
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
     * The user itself
     * @type {import('./User')}
     */
    this.user = this.client.canCache('user') ? this.client.users.get(data.user.id) || new (require('./User'))(this.client, data) : new (require('./User'))(this.client, data);

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

    /**
     * The guild (private)
     * @private
     * @type {import('./Guild')}
     */
    this._guild = this.client.canCache('guild') ? this.client.guilds.get(data.guild_id) || null : null;

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
    if (!this.client.canCache('member:role')) return null;

    return this.roles.get(this.hoistedRoleID) || null;
  }

  /**
   * Bans this member from this guild, if the guild isn't cached
   * we do a REST request to fetch the guild
   * @param {import('./Guild').BanOptions} opts The options to use
   */
  async ban(opts = {}) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.ban(this.id, opts);
  }

  /**
   * Unbans this member from this guild, if the guild isn't cached
   * we do a REST request to fetch the guild
   */
  async unban() {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.unban(this.id);
  }

  /**
   * Fetches new data for this [GuildMember] and resets the cache
   * and the properties of this [GuildMember] or throws a REST
   * error if anything occurs.
   */
  fetch() {
    return this.client.rest.dispatch({
      endpoint: `/guilds/${this.guildID}/members/${this.id}`,
      method: 'GET'
    }).then((data) => {
      this.patch(data);
      return this;
    });
  }

  /**
   * Edit the member's details if needed to. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later.
   *
   * @param {import('./Guild').EditGuildMemberOptions} opts The options to use
   * @returns {Promise<this>} Returns the newly edited data and
   * cached (if we can) or a REST error thrown
   */
  async edit(opts) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.editMember(this.id, opts);
  }

  /**
   * Adds a role to the member. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later.
   *
   * @param {string} roleID The role ID to add
   * @param {string} [reason] The reason to put in audit logs
   */
  async addRole(roleID, reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.addRole(this.id, roleID, reason);
  }

  /**
   * Removes a role from a member. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later. This will call
   * the `guildMemberUpdate` event that is emitted when called successfully.
   *
   * @param {string | import('./Role')} roleID The role ID or the role itself
   * @param {string} [reason] The reason to put in audit logs
   */
  async removeRole(roleID, reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    const id = typeof roleID === 'string' ? roleID : roleID.id;
    return this._guild.removeRole(this.id, id, reason);
  }

  /**
   * Sets the member's nickname. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later. This will call
   * the `guildMemberUpdate` event that is emitted when called successfully.
   *
   * @param {string} nick The nickname ot set
   * @param {string} [reason] The reason to put in audit logs
   */
  async setNick(nick, reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.editMember(this.id, { nick }, reason);
  }

  /**
   * Mutes the user in a voice channel. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later.
   *
   * @param {string} [reason] A reason to put in audit logs
   */
  async mute(reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.editMember(this.id, { mute: true }, reason);
  }

  /**
   * Unmutes the user in a voice channel. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later.
   *
   * @param {string} [reason] A reason to put in audit logs
   */
  async unmute(reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.editMember(this.id, { mute: false }, reason);
  }

  /**
   * Deafens the user in a voice channel. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later.
   *
   * @param {string} [reason] A reason to put in audit logs
   */
  async deafen(reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.editMember(this.id, { deaf: true }, reason);
  }

  /**
   * Undeafens the user in a voice channel. If the client can't cache
   * or it's not cached using a provider, it'll create a REST call to Discord
   * and possibly caches it and stores it later.
   *
   * @param {string} [reason] A reason to put in audit logs
   */
  async undeafen(reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    return this._guild.editMember(this.id, { deaf: true }, reason);
  }

  /**
   * Switches the user to a different channel, the bot must
   * require the **Move Members** permission before executiong
   * this action. The `voiceStateUpdate` event will emit
   * when called successfully.
   *
   * @param {string} channelID The channel to move to
   * @param {string} [reason] The reason to put in audit logs
   */
  async switch(channelID, reason) {
    if (!this._guild) {
      const guild = await this.client.getGuild(this.guildID);
      this._guild = guild;
    }

    /** @type {import('./channel/VoiceChannel')} */
    let channel = this.client.canCache('channel') ? this.client.channels.get(channelID) : null;
    if (!channel) {
      const chan = await this.client.getChannel(channelID);
      channel = chan;
    }

    if (channel.type !== 'voice') throw new SyntaxError(`Channel with ID "${channel.id}" was not a voice channel.`);
    return this._guild.editMember(this.id, { channelID: channel.id }, reason);
  }

  /**
   * Gets the DM channel of this [GuildMember]
   */
  getDMChannel() {
    return this.user.getDMChannel();
  }

  toString() {
    return `[GuildMember "${this.user.username}#${this.user.discriminator}" (ID: ${this.id}; G: ${this._guild ? this._guild.name : 'unknown'})]`;
  }
}

module.exports = GuildMember;

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
