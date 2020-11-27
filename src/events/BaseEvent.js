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

/**
 * The [base event] for handling all events coming from us -> Discord
 * @template T: The data type of the event
 */
module.exports = class BaseEvent {
  /**
   * Creates a new [BaseEvent] class
   * @param {import('../gateway/WebSocketShard')} shard The shard to use
   * @param {T} data The data to use
   */
  constructor(shard, data) {
    /**
     * The client the shard is using
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = shard.client;

    /**
     * The shard that this event is being emitted from
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.shard = shard;

    /**
     * The data that was emitted
     * @private
     * @type {T}
     */
    this.data = data;
  }

  process() {
    throw new TypeError('BaseEvent is missing overridable [process] function.');
  }
};
