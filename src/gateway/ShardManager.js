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

const { WebSocketShard } = require('./WebSocketShard');
const { Collection } = require('@augu/immutable');

/**
 * Represents the manager for handling all [WebSocketShard] connections
 * @extends {Collection<WebSocketShard>}
 */
module.exports = class ShardManager extends Collection {
  /**
   * Creates a new [ShardManager] instance
   * @param {import('../Client')} client The client
   */
  constructor(client) {
    super();

    /**
     * The client itself
     * @private
     * @type {import('../Client')}
     */
    this.client = client;
  }

  toString() {
    return `ShardManager [${this.size} shards]`;
  }

  /**
   * Spawns a new Shard
   * @param {number} id The shard ID
   * @param {'etf' | 'json'} [strategy='etf'] The strategy
   */
  spawn(id, strategy = 'etf') {
    const shard = new WebSocketShard(this.client, { id, strategy });
    shard
      .on('disconnect', (id) => this.client.emit('shardDisconnect', id))
      .on('establish', (id) => this.client.emit('shardOpen', id))
      .on('error', (id, error) => this.client.emit('shardError', id, error))
      .on('debug', (id, message) => this.client.emit('debug', `[Shard #${id}] ${message}`))
      .on('close', (id, error, recoverable) => this.client.emit('shardClose', id, error, recoverable))
      .on('ready', (id, guilds) => this.client.emit('shardReady', id, guilds))
      .on('warn', (id, message) => this.client.warn(`[Shard #${id}] ${message}`));

    shard.connect();
  }
};