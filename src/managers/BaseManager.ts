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

import { Collection } from '@augu/immutable';

/**
 * Represents a manager for handling entity cache
 */
export default class BaseManager<T> {
  /** The holdable object to construct with [BaseManager.add] */
  private holdable: any;

  /** The client to use */
  private client: any;

  /** The cache */
  public cache: Collection<T>;

  /**
   * Represents a manager for handling entity cache
   * @param client The client to use
   * @param holdable The holdable object
   */
  constructor(client: any, holdable: any) {
    this.holdable = holdable;
    this.client = client;
    this.cache = new Collection();
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
   * @param {any} data The data supplied from Discord
   * @returns {T} The cached object or a new instance of it
   */
  add(data: any): T {
    const existing = this.get(data.id) as any;
    if (existing && existing.patch) {
      existing.patch(data);
      this.cache.set(data.id, existing);
    }

    if (existing) return existing;

    if (data instanceof this.holdable) {
      this.cache.set(data.id, data);
      return data;
    } else {
      const obj = new this.holdable(this.client, data);
      this.cache.set(obj.id, obj);

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
    // @ts-ignore I know what I am doing.
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
    // @ts-ignore I know what I am doing.
    else if (idOrInstance instanceof this.holdable) id = idOrInstance.id;
    else throw new TypeError(`Expecting \`string\` or \`T\`, received ${typeof idOrInstance === 'object' ? 'array' : typeof idOrInstance}`);

    return this.cache.has(id);
  }

  valueOf() {
    return this.cache;
  }
}