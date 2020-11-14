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

const GuildRole = require('../entities/Role');
const BaseStore = require('./BaseStore');

/**
 * @extends {BaseStore<GuildRole>}
 */
module.exports = class GuildRoleStore extends BaseStore {
  /**
   * Creates a new [GuildRoleStore] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client instance
   */
  constructor(client) {
    super(
      client,
      GuildRole,
      client.canCache('member:role'),
      true
    );
  }

  /**
   * Fetches new data from Discord and possibly caches it
   * @param {string} guildID The guild's ID
   * @param {string} roleID The role's ID
   */
  fetch(guildID, roleID) {
    return this.client.rest.dispatch({
      endpoint: `/guilds/${guildID}/roles`,
      method: 'GET'
    }).then(roles => {
      const foundRole = roles.find(role => role.id === roleID);
      if (foundRole) this.add(foundRole);
    });
  }
};
