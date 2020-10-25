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

module.exports = class MessageCollector {
  /**
   * Creates a new [MessageCollector] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   */
  constructor(client) {
    /**
     * The collectors available per-channel
     * @type {Collection<Collector[]>}
     */
    this.collectors = new Collection();

    client.on('message', (msg) => this.verify(msg));
  }

  /**
   * Verifies the collector's message
   * @param {import('../Message')} msg The message
   */
  verify(msg) {
    const collector = this.collectors.get(msg.channelID);
    if (!collector.length) return;

    if (collector && collector[collector.length - 1].filter(msg)) {
      collector.splice(collector.length - 1, 1);
      this.collectors.set(msg.channelID, collector);

      return collector.accept(msg);
    }
  }

  /**
   * Awaits a new message, pushes to the callstack
   * and gets awaited by a filter function
   *
   * @param {FilterFunction} filter The filter to pass in
   * @param {CollectorOptions} options The options
   */
  awaitMessage(filter, options) {
    // this is an internal function, we don't need to validate it uwu
    return new Promise((resolve, reject) => {
      const collector = {
        accept: resolve,
        reject,
        filter
      };

      const collectors = this.collectors.get(options.channelID) || [];
      collectors.push(collector);

      this.collectors.set(options.channelID, collectors);
      const time = options.time < 1000 ? options.time * 1000 : options.time;

      setTimeout(() => {
        this.collectors.delete(key);
        return reject(new Error('Collector ran out of time'));
      }, time);
    });
  }
};

/**
 * @typedef {object} Collector
 * @prop {ResolveFunction} accept The function to accept
 * @prop {RejecterFunction} reject The function to reject the collector
 * @prop {FilterFunction} filter The filter function
 *
 * @typedef {object} CollectorOptions
 * @prop {string} channelID The channel ID
 * @prop {number} time How many [milli]seconds to reject the promise if nothing was found
 *
 * @typedef {(value: import('../Message') | PromiseLike<import('../Message')>) => void} ResolveFunction
 * @typedef {<E>(error: E extends Error ? E : never) => void} RejecterFunction
 * @typedef {(message: import('../Message')) => boolean} FilterFunction
 */
