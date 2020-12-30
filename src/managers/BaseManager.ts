/**
 * Copyright (c) 2020 August, Ice
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

import { Cachable, CacheTypes } from '../Constants';
import { Collection } from '@augu/collections';
import type Client from '../gateway/WebSocketClient';
import type Base from '../models/Base';

/**
 * Represents a manager for handling entity cache
 */
export default class BaseManager<T extends Base<{}>> {
  /** The holdable object to construct with [BaseManager.add] */
  private holdable: any;

  /** The cache type of this [BaseManager] */
  private cacheType: Cachable;

  /** The client to use */
  public client: Client;

  /** The cache */
  public cache: Collection<string, T>;

  /**
   * Represents a manager for handling entity cache
   * @param client The client to use
   * @param cacheType The cache type that this [BaseManager] represents
   * @param holdable The holdable object
   */
  constructor(client: Client, cacheType: Cachable, holdable: any) {
    if (cacheType === 'all' || cacheType === 'none') throw new TypeError('`cacheType` can\'t be `all` or `none`.');
    if (!CacheTypes.includes(cacheType)) throw new TypeError(`Cache type \`${cacheType}\` is not a valid cache type.`);

    this.cacheType = cacheType;
    this.holdable = holdable;
    this.client = client;
    this.cache = new Collection();
  }

  /**
   * If we are allowed to cache the object in this [BaseManager]
   */
  get canCache() {
    if (this.client.options.cache === 'none') return false;
    if (this.client.options.cache === 'all') return true;

    return Array.isArray(this.client.options.cache)
      ? this.client.options.cache.includes(this.cacheType)
      : this.client.options.cache === this.cacheType;
  }

  /**
   * Fetches data from Discord and caches it if not in it
   * @param args Any additional arguments to add
   */
  fetch(...args: any[]): Promise<T> {
    throw new TypeError('Overridable function [BaseManager.add] was not implemented.');
  }

  /**
   * Gets an object from cache or returns `null` if not found
   * @param id The ID of the cachable object to find
   * @returns Returns the cached object or `null` if not found
   */
  get(id: string) {
    return this.cache.get(id) || null;
  }

  /**
   * Adds a new object to the cache
   * @param data The data supplied from Discord
   * @returns The cached object or a new instance of it
   */
  add(data: any): T {
    const existing = this.get(data.id);
    if (existing && existing.patch) {
      existing.patch(data);
      this.cache.set(data.id, existing);
    }

    if (existing) return existing;

    if (data instanceof this.holdable) {
      if (this.canCache) this.cache.set(data.id, data);
      return data;
    } else {
      const obj = new this.holdable(this.client, data);
      if (this.canCache) this.cache.set(obj.id, obj);

      return obj;
    }
  }

  /**
   * Deletes an item from cache
   * @param idOrInstance The ID of the entity or the entity itself
   */
  remove(idOrInstance: string | T) {
    /** @type {string} */
    let id: string;

    if (typeof idOrInstance === 'string') id = idOrInstance;
    else if (idOrInstance instanceof this.holdable) id = idOrInstance.id;
    else throw new TypeError(`Expecting \`string\` or \`T\`, received ${typeof idOrInstance === 'object' ? 'array' : typeof idOrInstance}`);

    this.cache.delete(id);
  }

  /**
   * Checks if the entity exists in cache
   * @param idOrInstance The ID or the entity itself
   */
  has(idOrInstance: string | T) {
    /** @type {string} */
    let id: string;

    if (typeof idOrInstance === 'string') id = idOrInstance;
    else if (idOrInstance instanceof this.holdable) id = idOrInstance.id;
    else throw new TypeError(`Expecting \`string\` or \`T\`, received ${typeof idOrInstance === 'object' ? 'array' : typeof idOrInstance}`);

    return this.cache.has(id);
  }

  valueOf() {
    return this.cache;
  }

  toString() {
    return `[wumpcord.Manager<${(this.holdable.constructor as typeof Function).name}, ${this.cacheType}>]`;
  }
}
