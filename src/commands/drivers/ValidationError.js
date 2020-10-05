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

/** @type {{ [x in Code]: { message: string; howToFix: string; } }} */
const codes = {
  1000: {
    message: 'Schema wasn\'t abide by the schema',
    howToFix: 'Follow your schema used in Driver.schema'
  },
  1001: {
    message: 'Invalid type used',
    howToFix: 'Check what type you used for that specific key'
  },
  1002: {
    message: 'Value can\'t be nulled',
    howToFix: 'Check if `nullable` is enabled in the schema'
  },
  1003: {
    message: 'Value can\'t have a fixed size',
    howToFix: 'This is only supported in Arrays and Strings in SQL databases, check if the schema has a `size` property'
  }
};

module.exports = class ValidationError {
  /**
   * Creates a new [ValidationError] instance
   * @param {Code} code The code
   */
  constructor(code) {
    if (!codes.hasOwnProperty(code)) throw new SyntaxError(`Code "${code}" doesn't exist`);

    /**
     * How can we fix the validation error
     * @type {string}
     */
    this.howToFix = codes[code].howToFix;

    /**
     * The message
     * @type {string}
     */
    this.message = codes[code].message;

    /**
     * The validation code
     * @type {Code}
     */
    this.code = code;
  }

  /**
   * Statically create a [ValidationError]
   * @param {Code} code The code
   */
  static from(code) {
    return new ValidationError(code);
  }
};

/**
 * @typedef {1000 | 1001 | 1002 | 1003} Code
 */
