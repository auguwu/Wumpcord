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

import type { AbstractEntityCache } from '../cache/AbstractEntityCache';
import type { WebSocketClient } from '../Client';
import type { CachingOptions } from '../types';
import { NoopEntityCache } from '../cache/NoopCache';
import { MemoryCache } from '../cache/MemoryCache';

function getCacheEngine(options: CachingOptions) {
  if (options.engine === 'memory')
    return new MemoryCache();

  if (options.engine === 'no-op')
    return new NoopEntityCache();

  return options.engine ?? new MemoryCache();
}

/**
 * Represents a "store", to handling and retrieving entity cache
 */
export class BaseStore<D> {
  /**
   * The [[WebSocketClient]] attached to this [[BaseStore]]
   */
  public client: WebSocketClient;

  /**
   * The cache engine available for this [[BaseStore]]
   */
  public engine: AbstractEntityCache;

  constructor(client: WebSocketClient, type: keyof Omit<CachingOptions, 'engine'>) {
    const t = client.options.cache[type];

    this.client = client;
    this.engine = t === undefined ? getCacheEngine(client.options.cache) :
      t === 'memory'
        ? new MemoryCache()
        : t === 'no-op'
          ? new NoopEntityCache()
          : t as AbstractEntityCache;
  }

  /**
   * Abstract method to return data from Discord
   * @param args Any additional arguments to make the request
   * @returns A promise that has the class resolved and *possibly* cached
   * or a promise that rejects this request and throws a [[DiscordRestError]]
   * on why it failed.
   */
  fetch(...args: any[]): Promise<any> {
    return Promise.reject(new TypeError(`${this.constructor.name}#fetch is not implemented`));
  }

  /**
   * Returns data from cache if it's populated or `undefined` if nothing is found. Simpler
   * method to use since the entity cache is privated to this class.
   *
   * @param id The Snowflake to retrieve data from
   * @returns The resolved data or `undefined` if not cached
   */
  get(id: string): D | undefined {
    return this.engine.get(id);
  }

  /**
   * Simpler method for [[AbstractEntityCache#put]] since entity cache is privated in this class,
   * which adds data to cache with the newly entity created or an Error thrown if it couldn't succeed.
   *
   * @param data The data to place
   * @returns The resolved data or a error on why it failed
   */
  put(data: D) {
    return this.engine.put(data);
  }

  /**
   * Simpler method for [[AbstractEntityCache#put]] since entity cache is privated in this class,
   * which adds data to cache with the newly entity created or an Error thrown if it couldn't succeed.
   *
   * @deprecated This method is deprecated and removed in a future release, use [[BaseStore#put]] instead
   * @param data The data to place
   * @returns The resolved data or a error on why it failed
   */
  add(data: D) {
    return this.engine.put(data);
  }

  /**
   * Simpler method for [[AbstractEntityCache#remove]] since entity cache is privated in this class,
   * but a method to remove data from cache
   *
   * @param id The snowflake to resolve
   */
  remove(id: string) {
    return this.engine.remove(id);
  }

  /**
   * Simpiler method for [[AbstractEntityCache.has]] since entity cache is privated in this class,
   * but this method checks if a entity exists in cache.
   *
   * @param id The snowflake to resolve
   * @returns Returns a boolean value if the value exists
   */
  has(id: string) {
    return this.engine.has(id);
  }
}
