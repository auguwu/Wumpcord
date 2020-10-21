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

const { StickerType } = require('../Constants');
const Base = require('./Base');

/**
 * Represents a sticker sent from Discord, this is an experimental feature
 * so the data can change at anytime
 */
module.exports = class Sticker extends Base {
  /**
   * Creates a new [Sticker] instance
   * @param {import('./Message').StickerPacket} data The data
   */
  constructor(data) {
    super(data.id);

    this.patch(data);
  }

  /**
   * Patches this [Sticker] instance
   * @param {import('./Message').StickerPacket} data The data
   */
  patch(data) {
    /**
     * The name of the sticker
     * @type {string}
     */
    this.name = data.name;

    /**
     * The tags of the sticker
     * @type {string[]}
     */
    this.tags = data.tags.split(', ') || [];

    /**
     * The description of the sticker
     * @type {string[]}
     */
    this.description = data.description.split(', ') || [];

    /**
     * The pack ID the sticker is in
     * @type {string}
     */
    this.pack = data.pack_id;

    /**
     * The asset UUID
     * @type {string}
     */
    this.asset = data.asset;

    /**
     * The preview asset UUID
     * @type {string}
     */
    this.previewAsset = data.preview_asset;

    /**
     * The format type of the sticker
     * @type {'png' | 'apng' | 'lottie'}
     */
    this.format = StickerType[data.format_type];
  }

  toString() {
    return `[Sticker "${this.name}"]`;
  }
};
