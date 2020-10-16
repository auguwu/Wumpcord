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

const BaseChannel = require('../entities/BaseChannel');
const Store = require('./Store');

/**
 * @extends {Store<BaseChannel>}
 */
module.exports = class ChannelStore extends Store {
  /**
   * Creates a new [ChannelStore] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   */
  constructor(client) {
    super(client, BaseChannel);
  }

  /**
   * Fetches new data from Discord
   * @param {string} id The ID of the object
   * @returns {Promise<BaseChannel>} The object that is possibly cached
   * or throws a REST error if anything occurs
   */
  fetch(id) {
    return this.client.rest.dispatch({
      endpoint: `/channels/${id}`,
      method: 'get'
    })
      .then((data) => BaseChannel.from(this.client, data));
  }

  /**
   * Gets a channel from Discord
   * @param {string} id The ID of the object
   * @returns {Promise<BaseChannel | null>}
   */
};
