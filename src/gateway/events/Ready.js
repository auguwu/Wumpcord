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
 * @param {import('../WebSocketShard')} shard The shard
 */
const onReady = function (shard, { d: data }) {
  shard.client.user = new BotUser(shard.client, data.user);
  shard.sessionID = data.session_id;

  if (shard.client.options.cacheType === 'all') {
    shard.client.voiceConnections = new Collection();
    shard.client.channels = new Collection();
    shard.client.typings = new Collection();
    shard.client.guilds = new Collection();
    shard.client.users = new Collection({ [shard.client.user.id]: shard.client.user });
  } else {
    shard.client.voiceConnections = shard.client.canCache('voice:conenction') ? new Collection() : null;
    shard.client.channels = shard.client.canCache('channel') ? new Collection() : null;
    shard.client.typings = shard.client.canCache('typing') ? new Collection() : null;
    shard.client.guilds = shard.client.canCache('guild') ? new Collection() : null;
    shard.client.users = shard.client.canCache('user') ? new Collection({ [shard.client.user.id]: shard.client.user }) : null;
  }

  shard.unavailableGuilds = new Set(data.guilds.map(s => s.id));
  shard.status = ShardStatus.WaitingForGuilds;
  shard.checkReady();
};

module.exports = onReady;
