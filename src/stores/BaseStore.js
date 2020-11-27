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
const NotOverridedError = require('../exceptions/NotOverridedError');

/**
 * Represents a [Store] to handle cache-related to Wumpcord
 * @template T: The cache object
 * @abstract Method `fetch` should be over-rided or it'll throw an Error.
 */
module.exports = class BaseStore {
  /**
   * Creates a new [BaseStore] instance
   * @param {import('../gateway/WebSocketClient')} client The client to use
   * @param {T} holdable The holdable object to use
   * @param {boolean} cache If we should populate [BaseStore.cache] or not
   * @param {boolean} [injectClient=true] If we should inject `client` when creating a new holdable structure
   */
  constructor(client, holdable, cache, injectClient = true) {
    /**
     * The [WebSocketClient] to use
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The actual holdable object
     * @type {T}
     */
    this.holdable = holdable;

    /**
     * The cachable object to use
     * @type {Collection<T>}
     */
    this.cache = new Collection();

    /**
     * If we should inject `client` into the constructor
     * when creating a holdable structure
     *
     * @type {boolean}
     */
    this.injectClient = injectClient;

    /**
     * If we should cache properties
     * @type {boolean}
     */
    this.canCache = cache;
  }

  /**
   * Fetches a new object from Discord and possibly caches it
   * @param {...any} args Any arguments to use
   * @returns {Promise<T>} Returns the new object that is cached
   * or a REST error if anything occurs
   */
  fetch(...args) {
    throw new NotOverridedError('BaseStore', 'fetch');
  }

  /**
   * Gets an object from cache or returns `null` if not found
   * @param {string} id The ID of the cachable object to find
   * @returns {T | null} Returns the cached object or `null` if not found
   */
  get(id) {
    return this.cache.get(id) || null;
  }

  /**
   * Adds a new object to the cache
   * @param {any} data The data supplied from Discord
   * @returns {T} The cached object or a new instance of it
   */
  add(data) {
    const existing = this.get(data.id);
    if (existing && existing.patch) {
      existing.patch(data);
      if (this.canCache) this.cache.set(data.id, existing);
    }

    if (existing) return existing;

    const obj = data instanceof this.holdable
      ? data
      : this.injectClient
        ? new this.holdable(this.client, data)
        : new this.holdable(data);

    if (this.canCache) this.cache.set(data.id, obj);

    return obj;
  }

  /**
   * Deletes an item from cache
   * @param {string | T} idOrInstance The ID of the entity or the entity itself
   */
  remove(idOrInstance) {
    /** @type {string} */
    let id;

    if (typeof idOrInstance === 'string') id = idOrInstance;
    else if (idOrInstance instanceof this.holdable) id = idOrInstance.id;
    else throw new TypeError(`Expecting \`string\` or \`T\`, received ${typeof idOrInstance === 'object' ? 'array' : typeof idOrInstance}`);

    this.cache.delete(id);
  }

  /**
   * Checks if the entity exists in cache
   * @param {string | T} idOrInstance The ID or the entity itself
   */
  has(idOrInstance) {
    /** @type {string} */
    let id;

    if (typeof idOrInstance === 'string') id = idOrInstance;
    else if (idOrInstance instanceof this.holdable) id = idOrInstance.id;
    else throw new TypeError(`Expecting \`string\` or \`T\`, received ${typeof idOrInstance === 'object' ? 'array' : typeof idOrInstance}`);

    return this.cache.has(id);
  }

  valueOf() {
    return this.cache;
  }
};
