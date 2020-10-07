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

const { ServiceType } = require('./types');

/**
 * Represents a service to run when we receive something
 */
module.exports = class Service {
  /**
   * Creates a new [Service] instance
   * @param {string} type The service type to use
   */
  constructor(type) {
    /**
     * The service type
     * @type {import('./types').ServiceType[keyof import('./types').ServiceType]}
     */
    this.type = ServiceType[type];
  }

  /**
   * Initialises this [Service]
   * @param {import('./ClusterClient') | import('./ClusterCommandClient')} client The client
   */
  init(client) {
    /**
     * The clustered client
     * @type {import('./ClusterClient') | import('./ClusterCommandClient')}
     */
    this.client = client;

    return this;
  }

  /**
   * Abstract function to run this [Service]
   * @param {...any} args The arguments to run this [Service]
   * @returns {void | Promise<void>}
   */
  run(...args) {
    throw new SyntaxError(`Missing over-ride function in [Service.run] (${this.type})`);
  }
};
