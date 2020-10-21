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
 * Represents a voice region
 * @see [GET /voice/regions](https://discord.com/developers/docs/resources/voice#list-voice-regions)
 */
module.exports = class VoiceRegion {
  /**
   * Creates a new [VoiceRegion] instance
   * @param {VoiceRegionPacket} data The data supplied from Discord
   */
  constructor(data) {
    /**
     * The name of the region
     * @type {string}
     */
    this.name = data.name;

    /**
     * The region's ID
     * @type {string}
     */
    this.id = data.id;

    /**
     * If the region is a VIP-server or not
     * @type {boolean}
     */
    this.vip = data.vip;

    /**
     * If the region is a custom-based or not
     * @type {boolean}
     */
    this.custom = data.custom;

    /**
     * If the region is deprecated
     * @type {boolean}
     */
    this.deprecated = data.deprecated;

    /**
     * If it's optimal to use it or not
     * @type {boolean}
     */
    this.optimal = data.optimal;
  }
};

/**
 * @typedef {object} VoiceRegionPacket
 * @prop {string} id
 * @prop {string} name
 * @prop {boolean} vip
 * @prop {boolean} custom
 * @prop {boolean} deprecated
 * @prop {boolean} optimal
 */
