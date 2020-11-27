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

const BaseEvent = require('./BaseEvent');
const Presence = require('../entities/Presence');
const { User } = require('../entities');

/** @extends {BaseEvent<import('discord-api-types/v8').GatewayPresenceUpdateDispatch['d']>} */
module.exports = class PresenceUpdateEvent extends BaseEvent {
  /**
   * Gets the presence that was emitted
   * @returns {Presence}
   */
  get() {
    return new Presence(this.client, this.data);
  }

  /**
   * Gets the current guild
   * @returns {Promise<import('../entities/Guild')>}
   */
  getGuild() {
    if (!this.data.guild_id) throw new TypeError('`guild_id` was undefined, unable to get guild');

    return this.client.guilds.fetch(this.data.guild_id);
  }

  /**
   * Returns the user who has updated their presence
   * @returns {Promise<import('../entities/User')>}
   */
  getUser() {
    return this.client.users.fetch(this.data.user.id);
  }

  /**
   * Returns the old presence
   */
  get old() {
    return this._old || null;
  }

  async process() {
    const data = this.data;

    if (!this.client.canCache('presence') || !this.client.canCache('presence:activity'))
      this.shard.debug(`User "${data.user.id}" has updated their presence but can't be cached.`);

    if (!this.client.canCache('user') || !this.client.canCache('guild'))
      this.shard.debug(`User "${data.user.id}" has updated their presence but guilds or users can't be cached.`);

    const guild = await this.getGuild();
    const old = guild.presences.get(data.user.id);
    let user = this.client.users.get(data.user.id);

    if (!user) return;
    if (!user && data.user.username) {
      const usr = new User(this.client, data.user);

      this.client.users.add(usr);
      user = usr;
    }

    if (user.id !== data.user.id) return;
    if (old === null)
      this.shard.debug(`Presence wasn't cached for user ${user.tag}, [PresenceUpdateEvent.getOldPresence] will return nothing`);

    this._old = old;
    guild.presences.add(this.get());
  }
};
