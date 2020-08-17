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

const { ChannelTypes } = require('../util/Constants');
const BaseEntity = require('./BaseEntity');

/**
 * Represents a base Discord channel
 */
module.exports = class BaseChannel extends BaseEntity {
  /**
   * Creates a new [BaseChannel]
   * @param {import('../Client')} client The client
   * @param {ChannelPacket} data The data
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client
     * @type {import('../Client')}
     * @private
     */
    this.client = client;

    /**
     * The type of the channel
     * @type {'text' | 'dm' | 'voice' | 'store' | 'news' | 'group'}
     */
    this.type = ChannelTypes[data.type];
  }
};

/**
 * @typedef {object} ChannelPacket
 * @prop {number} type The channel type
 * @prop {string} id The channel's ID
 */