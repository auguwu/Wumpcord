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
 * Represents a class to handle Multipart data
 */
module.exports = class Multipart {
  /**
   * Creates a new [Multipart] instance
   */
  constructor() {
    /**
     * List of buffers to append
     * @type {Buffer[]}
     */
    this.buffers = [];

    /**
     * If this [Multipart] instance is finished
     * @type {boolean}
     */
    this.finished = false;
  }

  /**
   * Returns the boundary aspect
   */
  get boundary() {
    return '----------------Wumpcord';
  }

  /**
   * Appends a item to this [Multipart] instance
   * @template T The item itself
   * @param {string} field The field name
   * @param {T} data The data to append
   * @param {string} [filename] The filename
   * @arity Wumpcord.Utilities.Multipart.append/1
   */
  append(field, data, filename) {
    if (this.finished) return;
    if (typeof data === 'undefined') return;

    let str = `\r\n--${this.boundary}\r\nContent-Disposition: form-data; name="${field}"`;

    if (filename) str += `; filename="${filename}"`;
    if (Buffer.isBuffer(data)) str += '\r\nContent-Type: application/octet-stream';
    else if (typeof data === 'object') {
      str += '\r\nContent-Type: application/json';
      data = Buffer.from(JSON.stringify(data));
    } else {
      data = Buffer.from('' + data);
    }

    this.buffers.push(Buffer.from(`${str}\r\n\r\n`));
    this.buffers.push(data);
  }

  /**
   * Finishes this [Multipart] instance
   */
  finish() {
    if (this.finished) throw new TypeError('This [Multipart] instance is already finished');

    this.finished = true;
    this.buffers.push(Buffer.from(`\r\n--${this.boundary}--`));
    return this.buffers;
  }
};
