/**
 * Copyright (c) 2020-2021 August
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

import type { WebSocketClient } from '../Client';
import { Collection } from '@augu/collections';
import { Shard } from './Shard';

/**
 * Represents a manager of handling shard creation & disposing.
 */
export class ShardManager extends Collection<number, Shard> {
  #client: WebSocketClient;

  /**
   * Represents a manager of handling shard creation & disposing.
   * @param client The [[WebSocketClient]] attached to this [[ShardManager]].
   */
  constructor(client: WebSocketClient) {
    super();

    this.#client = client;
  }

  /**
   * Returns the average latency of all shards
   */
  get latency() {
    return this.reduce((a, b) => a + b.latency, 0) / this.size;
  }

  /**
   * Returns all of the connected shards available
   */
  get connected() {
    return this.filter(shard => shard.status === 'Connected');
  }

  /**
   * Returns a shard by it's guild ID
   * @param guildID The guild ID
   */
  getByGuildId(guildID: bigint): Shard | undefined;
  getByGuildId(guildID: string): Shard | undefined;
  getByGuildId(guildID: string | bigint) {
    const gid = typeof guildID === 'string' ? BigInt(guildID) : guildID;
    const sid = (Number(gid >> 22n)) % this.size;

    if (isNaN(sid))
      throw new TypeError(`got nan when doing (${gid} >> 22n) % shards`);

    return this.get(sid);
  }

  /**
   * Connects a shard to Discord, if there is a
   * shard available in this shard manager, it'll
   * attempt to re-connect or throw a Error if
   * a shard is already connected.
   *
   * @param id The shard ID to create
   */
  async connect(id: number) {
    let shard = this.get(id);
    if (shard !== undefined && shard.status !== 'Dead')
      throw new TypeError(`Shard #${id} already exists and is not dead.`);

    if (shard !== undefined && shard.status === 'Dead') {
      await shard.connect();
      return shard;
    }

    shard = new Shard(this.#client, id);
    shard
      .on('disconnect', (id, error)               => this.#client.emit('shardDisconnect', id, error))
      .on('disposed',   (id, error)               => this.#client.emit('shardDisposed', id, error))
      .on('connect',    (id)                      => this.#client.emit('shardConnect', id))
      .on('close', (id, code, error, recoverable) => this.#client.emit('shardClose', id, code, error, recoverable))
      .on('debug', (id, message)                  => this.#client.emit('shardDebug', id, message))
      .on('error', (id, error)                    => this.#client.emit('shardError', id, error))
      .on('resume', (id)                          => this.#client.emit('shardResume', id))
      .on('raw', (id, data)                       => this.#client.emit('shardRaw', id, data))
      .on('ready', (id, unavailable) => {
        this.#client.emit('shardReady', id, unavailable);
        this.set(shard!.id, shard!);

        this._checkReady();
      });

    return shard.connect();
  }

  /**
   * Disposes a shard from this shard manager
   * if connected, or it'll do nothing if shards
   * are dead.
   */
  dispose(id: number, reconnect: boolean = true) {
    const shard = this.get(id);
    if (shard === undefined)
      throw new TypeError(`Shard #${id} is not connected.`);

    shard.dispose(reconnect);
    return this;
  }

  // Checks if all shards are ready
  // and emits 'ready' if they are.
  private _checkReady() {
    if (this.#client.ready)
      return;

    for (const shard of this.values()) {
      if (!shard.ready)
        return;
    }

    this.#client.ready = true;
    this.#client.emit('ready');
  }
}
