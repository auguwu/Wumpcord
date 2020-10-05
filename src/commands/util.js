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
 * Utilities used in the [commands] API
 */
module.exports = {
  /**
   * Returns a polyfilled version of [fs.promises] if only:
   *
   * - User is running Node v10 or lower (it'll used the polyfilled version)
   * - User is running Node v10 or higher (it'll uses the `promises` API)
   * @type {typeof import('fs/promises')}
   */
  fs: (() => {
    try {
      return (require('fs')).promises;
    } catch(ex) {
      const { lstat, readdir } = require('fs');

      return {
        lstat: (path) => new Promise((resolve, reject) => lstat(path, (error, stats) => {
          if (error) return reject(error);
          return resolve(stats);
        })),
        readdir: (path, options) => new Promise((resolve, reject) => readdir(path, options, (error, files) => {
          if (error) return reject(error);
          return resolve(files);
        }))
      };
    }
  })(),

  /**
   * Checks if `value` is a Promise
   * @param {unknown} value The value
   * @returns {value is Promise<any>}
   */
  isPromise: (value) => value instanceof Promise && typeof value.then === 'function'
};
