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

import type { Client, CacheType } from '../Client';
import * as extensions from '../util/Extensions';
import { Collection } from '@augu/immutable';

/**
 * Represents a "base" store, to store objects (if we are allowed to cache them)
 */
export class BaseStore<T> {
  /**
   * The client
   */
  public client!: Client;

  /**
   * The class to inherit from
   */
  private holds!: T;

  /**
   * The collection to store items
   */
  private items: Collection<T>;

  /**
   * The ID of the store
   */
  public type: CacheType;

  /**
   * Creates a new [BaseStore]
   * @param client The client
   */
  constructor(client: Client, holds: T, type: CacheType) {
    this.items = new Collection();
    this.type = type;

    Object.defineProperty(this, 'client', { value: client });
    Object.defineProperty(this, 'holds', { value: extensions.resolve((holds as any).name) || holds });
  }

  /**
   * Checks if we could cache anything to this store
   */
  get isCached() {
    return this.client.options.cache === 'none' ||
      this.client.options.cache === this.type ||
      this.client.options.cache.includes(this.type);
  }

  /**
   * Gets an item from the cache (if it exists)
   * @param id The cached's ID or the cached item itself
   */
  resolve(id: string | T) {
    if (id instanceof (<any> this.holds)) return id as T;
    if (typeof id === 'string') return this.items.get(id) || null;

    return null;
  }

  /**
   * Adds an item to the cache
   * @param data The data to add
   */
  add(data: string | T) {
    // If we shouldn't cache it, then we won't
    if (!this.isCached) return;

    const exists = this.items.get(data || (<any> data).id) !== null;
    if (exists) {
      if (exists.hasOwnProperty('update')) (<any> data).update(data);
    }

    const entry = this.holds ? new (<any> this.holds)(this.client, data) : data as T;
    this.items.set(entry.id, entry);

    return entry;
  }
}