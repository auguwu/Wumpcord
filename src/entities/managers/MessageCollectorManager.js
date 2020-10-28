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

module.exports = class MessageCollectorManager {
  /**
   * Represents a [MessageCollectorManager], which manages any collectors available
   * from the user.
   *
   * @param {import('../../gateway/WebSocketClient')} client The WebSocket client
   * @param {import('../..').GuildTextableChannel} channel The channel that is using this manager
   */
  constructor(client, channel) {
    /**
     * On-going collections for this manager, keyed as
     * `userID: Session`
     *
     * @type {Collection<Session>}
     */
    this.sessions = new Collection();

    /**
     * List of timeouts per-session
     * @type {Collection<NodeJS.Timeout>}
     */
    this.timeouts = new Collection();

    /**
     * The channel that this manager belongs to, populated using
     * [GuildTextableChannel.collector]
     */
    this.channel = channel;

    /**
     * The client that this manager belongs to
     * @type {import('../../gateway/WebSocketClient')}
     */
    this.client = client;

    const verify = this.verify.bind(this);
    this.client.on('message', verify);
  }

  /**
   * Creates a new session and waits for an awaited message
   * @param {string} userID The user's ID
   * @param {FilterFunction<import('../Message')> | MessageCollectOptions} [filter] The filter function or options used
   * @param {MessageCollectOptions} [options] Any additional options
   * @returns {Promise<import('../Message')>}
   */
  createSession(userID, filter, options) {
    if (!userID) throw new TypeError('Missing author ID');

    /** @type {FilterFunction<import('../Message')>} */
    let f;

    /** @type {MessageCollectOptions} */
    let opts;

    if (typeof filter === 'object' && !Array.isArray(filter)) {
      f = (m) => m.author.id === userID;
      opts = filter;
    } else if ((typeof options === 'object' && !Array.isArray(filter)) && !filter) {
      f = (m) => m.author.id === userID;
      opts = options;
    } else if (filter && (typeof options === 'object' && !Array.isArray(options))) {
      f = filter;
      opts = options;
    } else {
      throw new TypeError('Options didn\'t pass in successfully (https://docs.augu.dev/Wumpcord/errors/options)');
    }

    if (this.sessions.has(userID)) return;
    return new Promise((resolve, reject) => {
      /** @type {Session} */
      const session = { resolve, reject, filter: f };

      this.sessions.set(userID, session);
      if (opts.time !== undefined && !isNaN(Number(opts.time))) {
        const timeout = setTimeout(() => {
          this.cleanup(userID, 'timeout');
          return reject({ user: userID, reason: 'timeout' });
        }, this._formatTime(opts.time));

        timeout.unref();
        if (this.timeouts.has(userID)) this.timeouts.delete(userID);

        this.timeouts.set(userID, timeout);
      }
    });
  }

  _formatTime(s) {
    return s < 1000 ? s * 1000 : s;
  }

  /**
   * Starts the process of verifying sessions
   * @param {import('../Message')} msg The message
   */
  verify(msg) {
    console.log(msg);

    if (!msg.author) return;
    if (msg.author.bot) return; // lol

    const session = this.sessions.get(msg.author.id);
    if (session && session.filter(msg)) {
      if (this.timeouts.has(msg.author.id)) {
        const timeout = this.timeouts.get(msg.author.id);
        clearTimeout(timeout);
      }

      this.cleanup(msg.author.id, 'resolved');
      return resolve(msg);
    }
  }

  /**
   * Cleans-up this [MessageCollectorManager] for a user
   * @param {string} userID The user's ID
   * @param {'resolved' | 'timeout'} [reason] The reason why it was closed
   */
  cleanup(userID, reason) {
    if (!this.sessions.has(userID)) return;

    const timeout = this.timeouts.get(userID);
    if (timeout) clearTimeout(timeout);

    const session = this.sessions.get(userID);
    if (reason === 'resolved') {
      this.sessions.delete(userID);
      return;
    } else {
      this.sessions.delete(userID);
      return session.reject({ user: userID, reason: reason || 'disposed' });
    }
  }
};

/**
 * @typedef {(error?: any) => void} RejectFunction
 *
 * @typedef {object} Session
 * @prop {ResolveFunction<import('../Message')>} resolve Function to resolve the Promise
 * @prop {FilterFunction<import('../Message')>} filter The filter to pass-in
 * @prop {RejectFunction} reject Function to reject the Promise
 *
 * @typedef {object} MessageCollectOptions
 * @prop {number} [time]
 */

/**
 * @typedef {(value?: V | PromiseLike<V>) => void} ResolveFunction
 * @template V
 */

/**
 * @typedef {(obj: V) => boolean} FilterFunction
 * @template V
 */
