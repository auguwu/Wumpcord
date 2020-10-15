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

/**
 * Represents an abstract class to store objects
 * into a provider and save it for later and
 * disposed if needed
 *
 * @template T The object to store as
 */
module.exports = class BaseStore {
  /**
   * Creates a new [BaseStore] instance
   * @param {import('../gateway/WebSocketClient')} client The client instance
   * @param {Class<T>} holdable The holdable object
   */
  constructor(client, holdable) {
    /**
     * The client instance
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The holdable object
     * @private
     * @type {Class<T>}
     */
    this.holdable = holdable;
  }

  /**
   * Fetches new data from Discord
   * @param {string} id The ID of the object
   * @returns {Promise<T>} The object that is possibly cached
   * or throws a REST error if anything occurs
   */
  fetch(id) {
    throw new TypeError('Missing [BaseStore.fetch] function');
  }

  /**
   * Gets an object from the store
   * @param {string} id The ID of the object
   * @returns {Promise<T | null>} Returns the object
   * that was cached, `null` if it's not cached,
   * or a REST error if anything occurs
   */
  get(id) {
    throw new TypeError('Missing [BaseStore.get] function');
  }

  /**
   * Patches an object with new data and possibly caches it
   * @template U The data that needs to be patched
   * @param {string} id The ID of the object
   * @param {U} data The data that needs to be patched
   * @returns {Promise<T>} Returns the object that was patched
   */
  patch(id, data) {
    throw new TypeError('Missing [BaseStore.patch] function');
  }

  /**
   * Deletes the object from the cache provider
   * @param {string} id The ID of the object
   * @returns {Promise<void>} Returns an empty response
   * or a REST error if anything occurs
   */
  delete(id) {
    throw new TypeError('Missing [BaseStore.delete] function');
  }

  /**
   * Returns the size of the store
   * @returns {Promise<number>} Returns the number of
   * objects in this store
   */
  size() {
    throw new TypeError('Missing [BaseStore.size] function');
  }
};

/**
 * @typedef {new (...args: any[]) => T} Class
 * @template T
 */
