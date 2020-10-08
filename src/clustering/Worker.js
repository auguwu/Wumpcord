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

const { Status, OPCodes } = require('./types');
const EventBus = require('../util/EventBus');

/**
 * Represents a class that is a [Worker] to accept IPC requests and other stuff
 */
module.exports = class Worker extends EventBus {
  /**
   * Creates a new [Worker] instance
   * @param {import('./ClusterClient') | import('./ClusterCommandClient')} client The client instance
   * @param {import('cluster').Worker} worker The base worker
   * @param {number} id The worker ID
   * @param {number[]} shards Tuple of shards available for this [Worker] instance
   */
  constructor(client, worker, id, shards) {
    super();

    /**
     * The client instance
     * @private
     * @type {import('./ClusterClient') | import('./ClusterCommandClient')}
     */
    this.client = client;

    /**
     * Tuple of shards available for this [Worker]
     * @type {number[]}
     */
    this.shards = shards;

    /**
     * The worker status
     * @type {number}
     */
    this.status = Status.Offline;

    /**
     * The base worker
     * @type {import('cluster').Worker}
     */
    this.base = worker;

    /**
     * The ID of the worker
     * @type {number}
     */
    this.id = id;

    process
      .on('unhandledRejection', (reason, promise) => this.emit('unhandledRejection', reason, promise))
      .on('uncaughtException', (error) => this.emit('uncaughtException', error))
      .on('message', this.onMessage.bind(this));
  }

  /**
   * Sends a message and pushes it to master to evaluate
   * @template T The data
   * @template U The returned data
   * @param {number} op The OPCode
   * @param {T} [data] The data supplied
   * @param {number} [priority] The priority of the message (`0` = no, `1` = yes)
   * @returns {Promise<U>} Promise of resolved data
   */
  send(op, data, priority = 0) {
    if (this.status !== Status.Online) return;

    return this.client.messaging.push(op, data, priority);
  }

  /**
   * Spawns the worker
   */
  spawn() {
    return new Promise((resolve, reject) => {
      this.base.on('online', () => {
        this.client.emit('spawned', this.id);
        this.status = Status.Online;

        clearTimeout(this.readyTimeout);
        resolve();
      });

      this.base.on('message', this.client.onWorkerMessage.bind(this.client));

      /**
       * The timeout
       * @type {NodeJS.Timeout}
       */
      this.readyTimeout = setTimeout(() => reject(new Error(`Worker #${this.id} took too long to get ready`)), 30000);
    });
  }

  /**
   * Message handler from Master -> Worker
   * @param {import('./ClusterClient').AnyMessage} message The message
   */
  onMessage(message) {
    console.log(message);
  }
};
