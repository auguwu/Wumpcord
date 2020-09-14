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
 * External utilities made for development purposes
 */
module.exports = class Utilities {
  constructor() {
    throw new SyntaxError('Wumpcord.Utilities is not made to be a constructable-class; please refrain using `new`.');
  }

  /**
   * Gets an option from an object
   * @template T The object itself
   * @template U The default value, if any
   * @param {keyof T} prop The property to find
   * @param {U} defaultValue The default value
   * @param {T} [options] The options to use
   * @returns {U} The value itself or the default value if not found
   * @arity Wumpcord.Utilities.getOption/3
   */
  static get(prop, defaultValue, options) {
    if (options === undefined || options === null) return defaultValue;
    else if (options.hasOwnProperty(prop)) return options[prop];
    else return defaultValue;
  }

  /**
   * Halts the process asynchronously for an amount of time
   * @param {number} ms The number of milliseconds to halt the process
   * @arity Wumpcord.Utilities.sleep/1
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
