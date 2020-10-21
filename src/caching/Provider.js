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

const EventBus = require('../util/EventBus');

/**
 * Represents a base provider, to provide a caching solution
 */
module.exports = class BaseProvider extends EventBus {
  /**
   * Creates a new [BaseProvider] instance
   * @param {string} name The provider's name
   */
  constructor(name) {
    super();

    if (!name) throw new TypeError('Missing `name` in BaseProvider');
    if (typeof name !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof name}`);

    /**
     * The name of the provider
     * @type {string}
     */
    this.name = name;
  }

  /**
   * Connects to the provider, if it needs to be connected
   * @returns {Promise<void>} Returns a Promise of nothing
   */
  connect() {}

  /**
   * Disposes the provider, required to use
   * @returns {void | Promise<void>} Can return nothing if it's
   * synchronous or a Promise of nothing if it's asynchronous
   */
  dispose() {
    throw new TypeError('Missing `dispose()` function');
  }

  toString() {
    return `[BaseProvider "${this.name}"]`;
  }
};
