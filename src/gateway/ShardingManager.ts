/**
 * Copyright (c) 2020-2021 August, Ice
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

import type WebSocketClient from './WebSocketClient';
import type * as types from '../types';
import { Collection } from '@augu/collections';
import WebSocketShard from './WebSocketShard';

export default class ShardManager extends Collection<number, WebSocketShard> {
  /** Reference for creating a [WebSocketShard] */
  private client: WebSocketClient;

  constructor(client: WebSocketClient) {
    super();

    this.client = client;
  }

  /**
   * Returns the avg. ping of all shards
   */
  get ping() {
    return this.filter(shard => shard.ping !== -1).reduce((a, b) => b.ping + a, 0);
  }

  toString() {
    return `[ShardManager (${this.size} shards)]`;
  }

  /**
   * Spawns a new shard
   * @param id The ID
   * @param strategy The serialization strategy
   */
  spawn(id: number, strategy: types.ClientOptions['strategy']) {
    if (this.has(id)) {
      const shard = this.get(id)!;
      return shard.connect();
    }

    const shard = new WebSocketShard(this.client, id, strategy);
    shard
      .on('disconnect', (id) => this.client.emit('shardDisconnect', id))
      .on('establish', (id)  => this.client.emit('shardSpawn', id))
      .on('debug', (id, msg) => this.client.debug(`Shard #${id}`, msg))
      .on('error', (id, error) => this.client.emit('shardError', id, error))
      .on('close', (id, error, recoverable) => this.client.emit('shardClose', id, error, recoverable))
      .on('ready', (id) => this.client.emit('shardReady', id));

    return shard.connect();
  }

  /**
   * Connects a shard to Discord
   * @param id The shard's ID
   */
  connect(id: number) {
    if (!this.has(id)) return;

    const shard = this.get(id)!;
    if (shard.status === 'connected') return;

    return this.spawn(shard.id, shard.strategy);
  }

  /**
   * Disposes a shard
   * @param id The shard's ID
   */
  dispose(id: number) {
    if (!this.has(id)) return;

    const shard = this.get(id)!;
    if (shard.status === 'dead') return;

    return shard.disconnect(false);
  }
}
