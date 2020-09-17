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

const { ChannelTypes } = require('../Constants');
const Base = require('./Base');

module.exports = class BaseChannel extends Base {
  /**
   * Creates a new [BaseChannel] instance
   * @param {any} data The data supplied from Discord 
   */
  constructor(data) {
    super(data.id);

    /**
     * The type of the channel
     * @type {string}
     */
    this.type = ChannelTypes[data.type];
  }

  /**
   * Creates a new Channel by it's type
   * @param {import('../gateway/WebSocketClient')} client The ws client to use
   * @param {any} data The data
   * @returns {BaseChannel} The channel
   */
  static from(client, data) {
    // lazy load them since js is a piece of shit lol

    const CategoryChannel = require('./channel/CategoryChannel');
    const StoreChannel = require('./channel/StoreChannel');
    const VoiceChannel = require('./channel/VoiceChannel');
    const TextChannel = require('./channel/TextChannel');
    const NewsChannel = require('./channel/NewsChannel');
    const DMChannel = require('./channel/DMChannel');

    switch (data.type) {
      case 0: return new TextChannel(client, data);
      case 1: return new DMChannel(client, data);
      case 2: return new VoiceChannel(client, data);
      //case 3: return new GroupChannel(client, data);
      case 4: return new CategoryChannel(client, data);
      case 5: return new NewsChannel(client, data);
      case 6: return new StoreChannel(client, data);
      default: return new BaseChannel(data);
    }
  }
};
