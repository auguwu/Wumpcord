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

const { Queue } = require('@augu/immutable');

/**
 * Represents a messaging broker to simulate requests using IPC
 */
module.exports = class MessagingBroker {
  /**
   * Creates a new [MessagingBroker] instance
   * @param {import('../ClusterClient') | import('../ClusterCommandClient')} client The client instance
   */
  constructor(client) {
    /**
     * The client
     * @private
     * @type {import('../ClusterClient') | import('../ClusterCommandClient')}
     */
    this.client = client;

    /**
     * The queue of messages
     * @type {Queue<Message>}
     */
    this.queue = new Queue();
  }

  /**
   * Gets the current queue size
   */
  get length() {
    return this.queue.size();
  }

  /**
   * Broadcasts a message to all workers
   * @template T The data
   * @template U The returned data
   * @param {string} op The OPCode
   * @param {T} [data] The data supplied
   * @param {number} [priority] The priority of the message (`0` = no, `1` = yes)
   * @returns {Promise<Array<U>>} Promise of resolved data
   */
  broadcast(op, data, priority = 0) {
    // if it goes over 1, make it not a priority
    if (priority > 1) priority = 0;

    return new Promise((resolve, reject) => {
      const fn = priority === 0 ? 'add' : 'addFirst';
      const nonce = require('crypto').randomBytes(4).toString('hex');

      this.queue[fn]({
        workerID: 'global',
        resolve,
        reject,
        nonce,
        data,
        op
      });

      for (const worker of this.client.workers.values()) worker.base.send({ workerID: 'global', op, data, resolve, reject });
    });
  }

  /**
   * Broadcasts a message to a worker
   * @template T The data
   * @template U The returned data
   * @param {number} workerID The worker's ID
   * @param {string} op The OPCode
   * @param {T} [data] The data supplied
   * @param {number} [priority] The priority of the message (`0` = no, `1` = yes)
   * @returns {Promise<U>} Promise of resolved data
   */
  broadcastTo(workerID, op, data, priority = 0) {
    // if it goes over 1, make it not a priority
    if (priority > 1) priority = 0;

    return new Promise((resolve, reject) => {
      if (!this.client.workers.has(workerID)) return reject(new Error(`Worker #${workerID} doesn't exist`));

      const fn = priority === 0 ? 'add' : 'addFirst';
      const nonce = require('crypto').randomBytes(4).toString('hex');

      this.queue[fn]({
        workerID,
        resolve,
        reject,
        nonce,
        data,
        op
      });

      const worker = this.client.workers.get(workerID);
      worker.base.send({ workerID, data, op, resolve, reject });
    });
  }

  /**
   * Removes the message by it's nonce
   * @param {string} nonce The nonce to find
   */
  pop(nonce) {
    const found = this.queue.find(message => message.nonce === nonce);
    if (!found) return false;

    this.queue.remove(found);
    return true;
  }

  /**
   * Find a message by it's nonce
   * @param {string} nonce The nonce string
   */
  find(nonce) {
    return this.queue.find(message => message.nonce === nonce);
  }
};

/**
 * @typedef {object} Message
 * @prop {number | 'global'} workerID The worker's ID (it returns `global` if MessagingBroker.broadcast is used)
 * @prop {<T>(value?: T | PromiseLike<T>) => void} resolve Function to resolve the broker
 * @prop {<E extends Error>(error?: E) => void} reject Function to push a error when it has errored
 * @prop {string} nonce The nonce string to validate requests
 * @prop {any} [data] The data sent (if any)
 * @prop {string} op The OPCode
 */
