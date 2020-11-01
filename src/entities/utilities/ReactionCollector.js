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
const EventBus = require('../../util/EventBus');
const Util = require('../../util/Util');

/**
 * Represents a collector to collect reactions
 */
module.exports = class ReactionCollector extends EventBus {
  /**
   * Creates a new [ReactionCollector] instance
   * @param {import('../Message')} message The message
   * @param {FilterFunction} filter The filter function
   * @param {ReactionCollectorOptions} options The options
   */
  constructor(message, filter, options) {
    super();

    /**
     * The WebSocketClient to use
     * @private
     * @type {import('../../gateway/WebSocketClient')}
     */
    this.client = message.client;

    /**
     * The message to listen to reactions to
     * @type {import('../Message')}
     */
    this.message = message;

    /**
     * The filter to receive reactions
     * @type {FilterFunction}
     */
    this.filter = filter;

    /**
     * The options to use
     * @type {ReactionCollectorOptions}
     */
    this.options = Util.merge(options, {
      permanent: true,
      time: 60000,
      max: 5
    });

    /**
     * The reactions we received
     * @type {Queue<ReactedEmoji>}
     */
    this.reactions = new Queue();

    /**
     * If the reaction collector is disposed or not
     * @type {boolean}
     */
    this.disposed = false;

    this.client.on('messageReactionAdd', this.onReaction.bind(this));
    if (this.options.time) {
      /**
       * The timeout to run
       * @type {NodeJS.Timeout}
       */
      this._timeout = setTimeout(() => this.end('time'), this.options.time);
    }
  }

  /**
   * Received when we receive a reaction
   * @param {import('../Message')} message The message
   * @param {import('../User')} user The user who reacted to it
   * @param {import('../Emoji')} emoji The emoji they reacted to
   */
  async onReaction(message, user, emoji) {
    if (message.id !== this.message.id) return;

    const cached = !message.hasOwnProperty('author') ? await this.client.getMessage(this.message.channelID, message.id) : message;
    if (this.filter(cached)) {
      this.reactions.add({ message: cached, user, emoji });
      this.emit('react', { message: cached, user, emoji });

      if (this.reactions.size() > this.options.max) return this.end('maxTries');
    }
  }

  /**
   * Ends the collector and disposes everything
   * @param {'maxTries' | 'time' | string} reason The reason why
   */
  end(reason) {
    if (this.disposed) return;

    this.disposed = true;
    if (!this.options.permanent) this.client.remove('messageReactionAdd', this.onReaction.bind(this));
    if (this._timeout) clearTimeout(this._timeout);

    this.emit('disposed', this.reactions, reason || 'none');
  }
};

/**
 * @typedef {(message: import('../Message')) => boolean} FilterFunction
 *
 * @typedef {object} ReactionCollectorOptions
 * @prop {boolean} [permanent=true] If we should keep the listener in the emitter
 * @prop {number} [time=60000] The time to collect all reactions
 * @prop {number} [max=5] The fixed length to collect reactions
 *
 * @typedef {object} ReactedEmoji
 * @prop {import('../Message')} message The message
 * @prop {import('../User')} user The user who reacted to it
 * @prop {import('../Emoji')} emoji The emoji they reacted to
 */
