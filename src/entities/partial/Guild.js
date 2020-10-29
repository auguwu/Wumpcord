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

const Base = require('../Base');

module.exports = class PartialGuild extends Base {
  /**
   * Creates a new [PartialGuild] instance
   * @param {import('../../gateway/WebSocketClient')} client The WebSocket client
   * @param {import('discord-api-types/v8').APIGuild} data The data supplied
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client itself
     * @type {import('../../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The guild icon
     * @type {?string}
     */
    this.icon = data.icon;

    /**
     * The name of the guild
     * @type {string}
     */
    this.name = data.name;
  }

  /**
   * Fetches the data and returns a full-fetched guild
   * and possibly caches it
   *
   * @returns {Promise<import('../Guild')>}
   */
  fetch() {
    return this.client.getGuild(this.id);
  }
};
