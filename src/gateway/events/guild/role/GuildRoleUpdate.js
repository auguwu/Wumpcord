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

const Role = require('../../../../entities/Role');

/**
 * Function to call when a role has been updated in a guild
 * @type {import('../..').EventCallee}
 */
const onGuildRoleUpdate = function ({ d: data }) {
  if (!this.client.canCache('guild') || !this.client.canCache('member:role')) {
    this.debug('Missing `guild` and `role` cache options, sending partial data');
    this.client.emit('guildRoleUpdate', null, new Role(this.client, data.role));
    return;
  }

  const guild = this.client.guilds.get(data.guild_id);
  if (!guild) {
    this.debug(`Guild "${data.guild_id}" is possibly uncached, sending partial data`);
    this.client.emit('guildRoleUpdate', null, new Role(this.client, data.role));
    return;
  }

  const role = guild.roles.get(data.role.id) || { id: data.role.id };
  guild.roles.get(data.role.id, role);
  this.client.emit('guildRoleUpdate', role, new Role(this.client, data.role));
};

module.exports = onGuildRoleUpdate;
