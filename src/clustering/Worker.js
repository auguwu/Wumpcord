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
const cluster = require('cluster');

/**
 * Represents a class that is a [Worker] to accept IPC requests and other stuff
 */
module.exports = class Worker {
  /**
   * Creates a new [Worker] instance
   * @param {import('./ClusterClient') | import('./ClusterCommandClient')} client The client instance
   * @param {import('cluster').Worker} worker The base worker
   * @param {number} id The worker ID
   * @param {number[]} shards Tuple of shards available for this [Worker] instance
   */
  constructor(client, worker, id, shards) {
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
      this.base.on('disconnect', async (code, signal) => {
        this.client.emit('close', this.id, code, signal || 'none');
        this.client.emit('debug', `Worker #${this.id} has died with code ${code}`);

        const w = cluster.fork();
        const worker = new this.constructor(this.client, w, w.id, this.shards);

        this.client.workers.delete(worker.id);
        await worker.spawn();
      });

      /**
       * The timeout
       * @type {NodeJS.Timeout}
       */
      this.readyTimeout = setTimeout(() => reject(new Error(`Worker #${this.id} took too long to get ready`)), 30000);
    });
  }

  /**
   * Returns if the worker is dead or not
   */
  get dead() {
    return this.base.isDead();
  }

  /**
   * Gets statistics of this [Worker]
   * @returns {Stats} The statistics gathered
   */
  getStatistics() {
    /** @type {number[]} */
    const shardsInWorker = [];
    const memory = process.memoryUsage();
    const shardStats = {};

    const stats = {
      workerID: this.id,
      memory: {
        heapTotal: memory.heapTotal,
        computed: (memory.rss - (memory.heapUsed - memory.heapTotal)),
        heapUsed: memory.heapUsed,
        rss: memory.rss
      }
    };

    this.shards.forEach(i => {
      if (!shardsInWorker.includes(i)) shardsInWorker.push(i);
    });

    for (const shardID of shardsInWorker) {
      const shard = this.client.shards.get(shard);
      if (!shard) break;

      shardStats[shardID] = {
        lastHeartbeatReceived: shard.lastReceived,
        lastHeartbeatSent: shard.lastSent,
        voiceConnections: 0, // voice isn't implemented, we are keeping this as zero
        largeGuilds: this.client.canCache('guild') ? this.client.guilds.filter(guild => guild.shardID === shardID && guild.memberCount > 250).length : 0,
        channels: this.client.canCache('channel') ? this.client.channels.filter(channel => channel.guild ? channel.guild.shardID === shardID : false).length : 0,
        guilds: this.client.canCache('guild') ? this.client.guilds.filter(guild => guild.shardID === shardID).length : 0,
        ping: shard.ping
      };
    }

    stats.shards = shardStats;
    return stats;
  }

  /**
   * Asynchronouslly evalulate JavaScript code
   * @param {EvalOptions} options The options to use
   */
  async eval(options) {
    try {
      result = eval(`(${options.async ? 'async' : ''}()=>{${options.script}});`);

      if (result instanceof Promise) result = await result;
      if (typeof result !== 'string') result = inspect(result, {
        depth: length,
        showHidden: false
      });

      return {
        async: options.async,
        result
      };
    } catch(ex) {
      return {
        result: {
          message: ex.message,
          name: ex.name,
          stack: ex.stack
        },
        async: options.async
      };
    }
  }
};

/**
 * @typedef {object} EvalOptions
 * @prop {number} depth The depth
 * @prop {boolean} async If it should be executed asynchronously
 * @prop {string} script The script to evaluate
 */
