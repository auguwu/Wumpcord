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

const { GatewayEvents, ShardStatus } = require('../../Constants');
const { Collection } = require('@augu/immutable');
const { BotUser } = require('../../entities');

/**
 * Received when the dispatcher calls `READY`
 * @type {import('.').EventCallee}
 */
const onReady = function ({ t, d: data }) {
  this.client.user = new BotUser(this.client, data.user);
  this.sessionID = data.session_id;

  if (t === GatewayEvents.Resumed) {
    this.debug(`Session "${this.sessionID}" has replayed ${this.seq === -1 ? 'no' : (data.s - this.seq).toLocaleString()} events`);

    this.status = ShardStatus.Connected;
    this.sendHeartbeat();
    this.emit('resume', this.seq === -1 ? 0 : (data.s - this.seq));
    return;
  }

  // And now the hard part: caching
  // It works in 2 different ways:
  //   1. Collection-based cache (stores in memory)
  //   2. Sets the length of the cache (doesn't store in memory)
  // If the cache type is 'none', we use #2
  // If the cache type is 'all', we use #1
  // If we specified the cache type (by string or array), we use #1 or #2
  if (this.client.options.cacheType === 'none') {
    this.client.channels = 0;
    this.client.guilds   = 0;
    this.client.users    = 1;
  } else if (this.client.options.cacheType === 'all') {
    this.client.channels = new Collection();
    this.client.guilds   = new Collection();
    this.client.users    = new Collection({ [this.client.user.id]: this.client.user });
  } else {
    this.client.channels = this.client.canCache('channel') ? new Collection() : 0;
    this.client.guilds   = this.client.canCache('guild')   ? new Collection() : 0;
    this.client.users    = this.client.canCache('user')    ? new Collection({ [this.client.user.id]: this.client.user }) : 1;
  }

  this.unavailableGuilds = new Set(data.guilds.map(s => s.id));
  this.status = ShardStatus.WaitingForGuilds;
  this.checkReady();
};

module.exports = onReady;
