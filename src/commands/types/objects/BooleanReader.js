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

const ArgumentTypeReader = require('../../arguments/ArgumentTypeReader');

/**
 * @extends {ArgumentTypeReader<boolean>}
 */
module.exports = class BooleanTypeReader extends ArgumentTypeReader {
  constructor(client) {
    super(client, 'boolean', ['bool']);

    this.truthy = new Set(['true', '+', '1', 'yes', 'y', 'si', 'on', 'enabled', 'enable']);
    this.falsy = new Set(['false', '-', '0', 'no', 'n', 'off', 'disable', 'disabled']);
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} val The raw value
   * @param {import('../../arguments/Argument')} arg The argument
   * @returns {MaybePromise<boolean>}
   */
  validate(ctx, val, arg) {
    if (this.truthy.has(val.toLowerCase())) return true;
    if (this.falsy.has(val.toLowerCase())) return true;

    return false;
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} val The raw value
   * @param {import('../../arguments/Argument')} arg The argument
   * @returns {MaybePromise<boolean>}
   */
  parse(ctx, val, arg) {
    const value = val.toLowerCase();
    if (this.truthy.has(value)) return true;
    if (this.falsy.has(value)) return false;

    throw new TypeError(`Value "${val}" is not a true/false statement`);
  }
};

/**
 * @typedef {import('../../arguments/ArgumentTypeReader').MaybePromise<T>} MaybePromise
 * @template T
 */
