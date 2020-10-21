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

const User = require('../User');

/**
 * Represents a guild ban
 */
module.exports = class GuildBan {
  /**
   * Creates a new [GuildBan] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {BanPacket} data The data
   */
  constructor(client, data) {
    /**
     * The reason of the ban
     * @type {?string}
     */
    this.reason = data.reason;

    /**
     * The guild if it was cached or not
     * @type {import('../Guild') | null}
     */
    this.guild = client.canCache('guild') ? client.guilds.get(data.guild_id) : null;

    /**
     * The user instance
     */
    this.user = client.canCache('user') ? client.users.get(data.user.id) || new User(client, data.user) : new User(client, data.user);
  }
};

/**
 * @typedef {object} BanPacket
 * @prop {string} guild_id The guild's ID (not passed in by Discord)
 * @prop {import('../User').UserPacket} user The user packet
 * @prop {string} [reason] The reason
 */
