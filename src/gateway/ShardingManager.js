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
const WebSocketShard = require('./WebSocketShard');
const Constants      = require('../Constants');

/**
 * Represents the sharding manager to spawn and destroy shards
 * @extends {Collection<WebSocketShard>}
 */
module.exports = class ShardingManager extends Collection {
  /**
   * Creates a new [ShardingManager] instance
   * @param {import('./WebSocketClient')} client The client
   */
  constructor(client) {
    super();

    /**
     * The client
     * @private
     * @type {import('./WebSocketClient')}
     */
    this.client = client;
  }

  toString() {
    return `[ShardManager (${this.size} shards)]`;
  }

  /**
   * Returns the latency of all shards
   */
  get ping() {
    const ping = this.reduce((a, b) => a + b.ping, 0);
    return ping;
  }

  /**
   * Spawns a new shard
   * @param {number} id The shard's ID
   * @param {'etf' | 'json'} strategy The strategy to use when (en/de)coding packets
   * @arity Wumpcord.Sharding.ShardingManager.spawn/2
   */
  spawn(id, strategy = 'etf') {
    if (this.has(id)) {
      const shard = this.get(id);
      if (shard.status === 0) return; // connected, let's not spawn another one >w>

      return shard.connect();
    }

    if (!Constants.StrategyTypes.includes(strategy)) throw new TypeError(`Expecting 'etf' or 'json', but received "${strategy}"`);

    const shard = new WebSocketShard(this.client, { id, strategy });
    shard
      .on('disconnect', id                  => this.client.emit('shardDisconnect', id))
      .on('establish',  id                  => this.client.emit('shardOpen', id))
      .on('error', (id, error)              => this.client.emit('shardError', id, error))
      .on('debug', (id, message)            => this.client.emit('debug', `[Shard #${id}] ${message}`))
      .on('close', (id, error, recoverable) => this.client.emit('shardClose', id, error, recoverable))
      .on('resume', (id, replayed)          => this.client.emit('shardResume', id, replayed))
      .on('ready', (id, guilds)             => this.client.emit('shardReady', id, guilds))
      .on('event', (id, data)               => this.client.emit('shardEvent', id, data))
      .on('warn', (id, message)             => this.client.emit('shardWarning', id, message));

    this.set(id, shard);
    return shard.connect();
  }

  /**
   * Disposes a [WebSocketShard]
   * @param {WebSocketShard} shard The shard to dispose
   * @arity Wumpcord.Sharding.ShardingManager.dispose/1
   */
  dispose(shard) {
    if (shard.status === Constants.ShardStatus.Disposed) return;

    shard.disconnect(false);
    shard.status = Constants.ShardStatus.Disposed;
  }

  /**
   * Forcefully re-connect a shard
   * @param {number} id The shard's ID
   */
  connect(id) {
    if (!this.has(id)) return;

    const shard = this.get(id);
    return this.spawn(shard.id, shard.strategy);
  }
};
