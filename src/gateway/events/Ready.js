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

const { ShardStatus } = require('../../Constants');
const { Collection } = require('@augu/immutable');
const { BotUser } = require('../../entities');

/**
 * Received when the dispatcher calls `READY`
 * @type {import('.').EventCallee}
 */
const onReady = function ({ d: data }) {
  this.client.user = new BotUser(this.client, data.user);
  this.sessionID = data.session_id;

  if (this.client.options.cacheType === 'all') {
    this.client.voiceConnections = new Collection();
    this.client.channels = new Collection();
    this.client.typings = new Collection();
    this.client.guilds = new Collection();
    this.client.users = new Collection({ [this.client.user.id]: this.client.user });
  } else {
    this.client.voiceConnections = this.client.canCache('voice:conenction') ? new Collection() : null;
    this.client.channels = this.client.canCache('channel') ? new Collection() : null;
    this.client.typings = this.client.canCache('typing') ? new Collection() : null;
    this.client.guilds = this.client.canCache('guild') ? new Collection() : null;
    this.client.users = this.client.canCache('user') ? new Collection({ [this.client.user.id]: this.client.user }) : null;
  }

  this.unavailableGuilds = new Set(data.guilds.map(s => s.id));
  this.status = ShardStatus.WaitingForGuilds;
  this.checkReady();
};

module.exports = onReady;
