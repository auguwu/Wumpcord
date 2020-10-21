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

const BaseProvider = require('./Provider');
const Util = require('../util/Util');

/**
 * Returns the `ioredis` package if it's installed
 * @returns {() => typeof import('ioredis')}
 */
const getRedis = (() => {
  try {
    return require('ioredis');
  } catch(ex) {
    return null;
  }
});

module.exports = class RedisProvider extends BaseProvider {
  /**
   * Creates a new [RedisProvider] instance
   * @param {import('ioredis').RedisOptions} opts The redis client options
   */
  constructor(opts) {
    super('redis');

    const Redis = getRedis();
    if (Redis === null) throw new TypeError('Missing `ioredis` package, please install it.');

    /**
     * If the connection is healthy or not
     * @type {boolean}
     */
    this.healthy = false;

    /**
     * The redis client
     * @private
     * @type {import('ioredis').Redis}
     */
    this.client = new Redis({
      lazyConnect: false,
      ...Util.pluck(opts, 'lazyConnect')
    });
  }

  /**
   * Asynchronouslly connects to Redis
   */
  async connect() {
    this.client.once('ready', () => {
      this.emit('connect');
      this.healthy = true;

      this.emit('debug', 'Connected to Redis, connection healthy');
    });

    this.client.on('wait', () => {
      this.emit('disconnect');
      this.healthy = false;

      this.emit('debug', 'Possibly lost connection, unhealthy.');
    });

    await this.client.connect();
  }

  /**
   * Disposes the connection with Redis
   */
  dispose() {
    return this.client.disconnect();
  }
};
