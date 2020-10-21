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

/**
 * Represents an invite from Discord
 */
module.exports = class GuildInvite {
  /**
   * Creates a new [GuildInvite] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   * @param {any} data The data
   */
  constructor(client, data) {
    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches this [GuildInvite] instance
   * @param {any} data The data
   */
  patch(data) {
    /**
     * How many uses this invite has
     * @type {number}
     */
    this.uses = data.uses || 0;

    /**
     * If the invite is temporary or not
     * @type {boolean}
     */
    this.temporary = data.temporary || false;

    /**
     * How many max uses this invite has
     * @type {number}
     */
    this.maxUses = data.max_uses || 0;

    /**
     * The maxmimum age that this invite is usable for, in milliseconds
     * @type {number}
     */
    this.maxAge = data.max_age ? data.max_age * 1000 : 0;

    /**
     * The timestamp of when this invite was create
     * @type {Date}
     */
    this.createdAt = new Date(data.created_at);

    /**
     * The channel that the invite in
     * @type {?import('./channel/TextChannel')}
     */
    this.channel = this.client.canCache('channel') ? this.client.channels.get(data.channel_id) || { id: data.channel_id } : null;

    /**
     * The guild that the invite is in
     * @type {?import('./Guild')}
     */
    this.guild = this.client.canCache('guild') ? this.client.guilds.get(data.guild_id) || { id: data.guild_id } : null;

    /**
     * The code of the invite
     * @type {string}
     */
    this.code = data.code;

    /**
     * The inviter who created this invite
     * @type {?import('./User')}
     */
    this.inviter = this.client.canCache('user') ? this.client.users.get(data.inviter.id) || new (require('./User'))(this.client, data.inviter) : null;
  }

  /**
   * Deletes the invite from this guild,
   * will fire the `inviteDelete` event when deleted
   * successfully
   *
   * @returns {Promise<boolean>} Boolean-represented value if it
   * was deleted successfully, after the next iteration of the process,
   * this won't be cached and will be deleted from Discord
   */
  delete() {
    return this.client.rest.dispatch({
      endpoint: `/invites/${this.code}`,
      method: 'DELETE'
    })
      .then(() => true);
  }

  /**
   * Fetches the recent data for this invite
   * @param {boolean} [withCounts] If we should add `with_counts` to the query,
   * to get the approx. member/presence count
   */
  fetch(withCounts = true) {
    return this.client.rest.dispatch({
      endpoint: `/invites/${this.code}${withCounts ? '?with_counts=true' : ''}`,
      method: 'GET'
    }).then((data) => {
      this.patch(data);
      return this;
    });
  }

  toString() {
    return `[Invite "https://discord.gg/${this.code}"]`;
  }
};
