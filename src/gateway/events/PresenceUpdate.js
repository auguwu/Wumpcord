const { User } = require('../../entities');
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

const Presence = require('../../entities/Presence');

/**
 * Function to call when a presence has been updated
 * @type {import('.').EventCallee}
 */
const onPresenceUpdate = function ({ d: data }) {
  if (!this.client.canCache('presence') || !this.client.canCache('presence:activity')) {
    this.debug(`User "${data.user.id}" has updated their presence but can't be cachable, sending data without caching`);
    this.client.emit('presenceUpdate', null, new Presence(this.client, data));
    return;
  }

  if (!this.client.canCache('user') || !this.client.canCache('guild')) {
    this.debug(`User "${data.user.id}" has updated their presence but guilds or users can't be cached, sending data without user data`);
    this.client.emit('presenceUpdate', null, new Presence(this.client, data));
    return;
  }

  const guild = this.client.guilds.get(data.guild_id);
  const oldPresence = guild.presences.get(data.user.id) || null;
  let user = this.client.users.get(data.user.id);

  if (!user) return;
  if (!user && data.user.username) {
    const u = new User(this.client, data.user);
    this.client.insert('user', u);

    user = u;
  }

  if (user.id !== data.user.id) return;
  if (oldPresence === null) {
    this.debug(`Presence wasn't cached for user "${data.user.id}", sending partial data`);
    this.client.emit('presenceUpdate', null, new Presence(this.client, data));
    return;
  }

  guild.presences.set(data.user.id, new Presence(this.client, data));
  this.client.emit('presenceUpdate', oldPresence, new Presence(this.client, data));
};

module.exports = onPresenceUpdate;
