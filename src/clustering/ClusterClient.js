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

const { Collection, Queue } = require('@augu/immutable');
const MessagingBroker = require('./bucket/Broker');
const Client = require('../gateway/WebSocketClient');
const { cpus } = require('os');
const cluster = require('cluster');
const Worker = require('./Worker');
const Util = require('../util/Util');

module.exports = class ClusterClient extends Client {
  /**
   * Creates a new [ClusterClient] instance
   * @param {import('../gateway/WebSocketClient').ClientOptions & ClusterClientOptions} options The options to use
   */
  constructor(options) {
    super(options);

    this.constructor._validate(options);

    /**
     * The number of workers to spawn, if nothing was specified, it'll use your CPU core count
     * @type {number}
     */
    this.workerCount = options.workerCount || cpus().length;

    /**
     * The messaging broker to queue messages from Master -> Worker
     * @type {MessagingBroker}
     */
    this.messaging = new MessagingBroker();

    /**
     * List of workers available
     * @type {Collection<import('./Worker')>}
     */
    this.workers = new Collection();

    /**
     * Number of [milli]seconds to clear eval cache
     * @type {number}
     */
    this.evalTimeout = options.evalTimeout ? (options.evalTimeout < 1000 ? options.evalTimeout * 1000 : options.evalTimeout) : 60000;

    /**
     * If we can re-queue dead workers
     * @type {boolean}
     */
    this.requeue = options.requeue || true;

    /**
     * Number of tries until we stop re-queueing dead workers
     * @type {number}
     */
    this.retries = options.retries || 5;

    /**
     * Queue of dead workers
     * @type {Queue<Worker>}
     */
    this.dead = new Queue();

    /**
     * List of node-like arguments to load when spawning
     * @type {string[]}
     */
    this.nodeArgs = options.nodeArgs || [];

    /**
     * Number of attempts for re-queueing workers
     * @type {number}
     */
    this.attempts = 0;
  }

  /**
   * Validates the options
   * @param {ClusterClientOptions} options The options to validate
   */
  static _validate(options) {
    if (!options) throw new TypeError('Missing `options` object');
    if (typeof options !== 'object' && !Array.isArray(options)) throw new TypeError(`Expected \`object\`, received ${typeof options}`);

    if (options.requeue && typeof options.requeue !== 'boolean') throw new TypeError(`Expected \`boolean\`, received ${typeof options.requeue}`);
    if (options.retries && typeof options.retries !== 'number') throw new TypeError(`Expected \`number\`, received ${typeof options.retries}`);
    if (options.workerCount && typeof options.workerCount !== 'number') throw new TypeError(`Expected \`number\`, received ${typeof options.workerCount}`);
    if (options.evalTimeout && typeof options.evalTimeout !== 'number') throw new TypeError(`Expected \`number\`, received ${typeof options.evalTimeout}`);

    if (options.nodeArgs) {
      if (!Array.isArray(options.nodeArgs)) throw new TypeError(`Expected \`array\`, received ${typeof options.nodeArgs}`);
      if (options.nodeArgs.some(arg => typeof arg !== 'string')) {
        const args = options.nodeArgs.filter(arg => typeof arg !== 'string');
        throw new TypeError(`${args.length} were not a string ([${args.join(', ')}])`);
      }
    }
  }

  /**
   * Loads this [ClusterClient]
   */
  async load() {
    this.emit('debug', [
      '-=- Booting up bot... -=-',
      `Workers:            ${this.workerCount}`,
      `Stats Enabled:      ${this.options.stats ? 'yes' : 'no'}`,
      `Evaluation Timeout: ${this.evalTimeout}ms`,
      'Using Commands API: No',
      '-=-  Initialising...  -=-'
    ].join('\n'));

    if (cluster.isMaster) {
      this.emit('debug', `Now spawning ${this.workerCount} workers! (calculating shard count...)`);
      const data = this.options.shardCount === 'auto'
        ? await this.getBotGateway()
        : await this.getGateway();

      if (!data.hasOwnProperty('url') || (this.options.shardCount === 'auto' && !data.hasOwnProperty('shards')))
        throw new SyntaxError('Unable to fetch data from Discord');

      if (data.url.includes('?')) data.url = data.url.substring(0, data.url.indexOf('?'));

      /** @type {SessionStartLimit | null} */
      const session = data.hasOwnProperty('session_start_limit') ? data.session_start_limit : null;
      if (session !== null && session.remaining <= 0) {
        const error = new Error('You have exceeded the amount of tries to connect to the gateway');
        error.resetAfter = session.reset_after;

        this.emit('error', error);
        throw error;
      }

      if (this.options.shardCount === 'auto') {
        this.options.shardCount = data.shards;
        if (this.lastShardID === 1) this.lastShardID = data.shards === 1 ? 1 : data.shards - 1;
      } else {
        this.lastShardID = this.options.shardCount;
      }

      if (this.workerCount > this.options.shardCount) {
        this.emit('debug', `Worker count was higher than shard count, setting it from ${this.workerCount} -> ${this.options.shardCount}`);
        this.workerCount = this.options.shardCount;
      }

      const shardTuple = Util.chunk([...Array(this.options.shardCount).keys()], this.workerCount);
      let spawned = 0;

      if (this.nodeArgs) {
        this.emit('debug', `Received ${this.nodeArgs.length} node-like arguments to add!`);
        cluster.setupMaster({ execArgv: this.nodeArgs });
      }

      for (let i = 0; i < this.workerCount; i++) {
        const tuple = shardTuple.shift();
        this.emit('debug', `Spawning worker #${i}... (shards [${tuple[0]} - ${tuple[tuple.length - 1]}])`);

        const fork = cluster.fork();
        const worker = new Worker(this, fork, i, tuple);
        this.workers.set(worker.id, worker);

        try {
          await worker.spawn();
          spawned++;
        } catch(ex) {
          this.emit('error', i, ex);
          if (this.requeue) {
            this.emit('debug', `Re-queueing worker #${i} later`);
            this.dead.add(worker);
          }
        }
      }

      if (this.dead.size()) {
        this.emit('debug', `Received ${this.dead.size()}/${spawned} workers to re-queue`);
        if (this.requeue) {
          await this._requeue(this.dead);
        } else {
          this.emit('debug', '`requeue` was false or not defined, not requeueing.');
          if (this.workers.empty) {
            this.emit('error', 'Main worker was not spawned, exiting');
            setTimeout(() => {
              this.dispose();
              process.exit(0);
            }, 5000);
          }
        }
      } else {
        this.emit('debug', 'All workers has spawned, now connecting to Discord...');
        await this.connect();
      }
    } else {
      // TODO: what else should go here?
      this.emit('debug', `Spawned as worker ${process.pid}`);
    }
  }

  /**
   * Re-queues old workers
   * @param {Queue<Worker>} old The old queue
   */
  async _requeue(old) {
    if (this.attempts > this.retries) {
      this.emit('warn', `Reached the maximum amount of tries (${this.retries}), not re-spawning...`);
      return;
    }

    this.emit('debug', `Attempting to respawn ${this.dead.size()} workers (${this.attempts}/${this.retries})`);
    this.attempts++;

    const queue = new Queue();

    for (let i = 0; i < old.size(); i++) {
      const worker = old.get(i);
      try {
        await worker.spawn();
        this.dead.remove(i);
      } catch(ex) {
        this.emit('error', i, ex);
        if (this.requeue) queue.add(worker);
      }
    }

    if (queue.empty) {
      this.emit('debug', 'Re-queued all dead workers, now connecting to Discord');
      await this.connect();
    } else {
      this.emit('debug', `Received ${queue.size()} workers, re-trying...`);
      await this._requeue(queue);
    }
  }

  /**
   * Message handler for workers
   * @private
   * @param {AnyMessage<any>} message The message that was received
   */
  onWorkerMessage(message) {
    console.log(`Master: ${JSON.stringify(message)}`);
  }
};

/**
 * @typedef {object} ClusterClientOptions
 * @prop {number} [workerCount] Number of workers to spawn, defaults to the current CPU count
 * @prop {number} [evalTimeout] Number in [milli]seconds to close the evaluation timeout
 * @prop {string[]} [nodeArgs] List of node arguments to spawn the worker with
 * @prop {boolean} [requeue] If we should re-queue dead workers
 * @prop {number} [retries] Number of re-tries to not respawn dead workers
 * @prop {boolean} [stats] If we should enable the `STATS` op-code
 *
 * @typedef {object} ClusterStats
 * @prop {number} largeGuilds Number of large guilds for this cluster
 * @prop {number} channels Number of channels available for this cluster
 * @prop {MemoryStats} memory Memory statistics for this cluster
 * @prop {number} guilds Number of guilds for this cluster
 * @prop {number} uptime The amount of time the worker has been up for
 * @prop {Collection<ShardStats>} shards List of shard statistics
 * @prop {number} users Number of users for this cluster
 * @prop {number} id The cluster's ID
 *
 * @typedef {object} ShardStats
 * @prop {Date} lastHeartbeatReceived The date when the last heartbeat was received
 * @prop {Date} lastHeartbeatSent The date when the last heartbeat was sent
 * @prop {number} voiceConnections Number of voice connections for this shard
 * @prop {number} largeGuilds Number of large guilds for this shard
 * @prop {number} channels Number of channels available for this shard
 * @prop {number} guilds Number of guilds for this shard
 * @prop {number} users Number of users for this cluster
 * @prop {number} ping The ping of the shard to/from Discord
 * @prop {number} id The shard's ID
 *
 * @typedef {object} MemoryStats
 * @prop {number} heapTotal Reffered to V8's memory usage
 * @prop {number} heapUsed Reffered to V8's memory usage
 * @prop {number} computed Computed values (formula: `rss + (heapUsed - heapTotal)`)
 * @prop {number} rss Resident Set Size, is the amount of space occupied in the main memory device (that is a subset of the total allocated memory) for the process, including all C++ and JavaScript objects and code.
 *
 * @typedef {object} AnyMessage
 * @prop {string} nonce Nonce string to validate
 * @prop {any} data The data
 * @prop {string} op The OPCode
 */
