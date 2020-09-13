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

const Base = require('./Base');

module.exports = class Attachment extends Base {
  /**
   * Creates a new [Attachment] class
   * @param {AttachmentPacket} data The data
   */
  constructor(data) {
    super(data.id);

    /**
     * The proxy URL
     * @type {?string}
     */
    this.proxyUrl = data.proxy_url;

    /**
     * The size in bytes
     * @type {number}
     */
    this.size = data.size;

    /**
     * The height of the image
     * @type {number}
     */
    this.height = data.height;

    /**
     * The width of the image
     * @type {number}
     */
    this.width = data.width;

    /**
     * The URL of the attachemtn
     * @type {string}
     */
    this.url = data.url;
  }
};

/**
 * @typedef {object} AttachmentPacket
 * @prop {number} width
 * @prop {string} url
 * @prop {number} size
 * @prop {string} proxy_url
 * @prop {string} id
 * @prop {number} height
 * @prop {string} filename
 */
