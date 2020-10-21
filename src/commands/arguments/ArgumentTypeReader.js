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
 * Represents a structure class to parse a [ArgumentTypeReader]
 * @template T: The argument value
 */
module.exports = class ArgumentTypeReader {
  /**
   * Creates a new [ArgumentTypeReader] instance
   * @param {import('../CommandClient')} client The client
   * @param {string} id The reader's ID
   * @param {string[]} [aliases=[]] Any additional aliases to find this [ArgumentTypeReader]
   */
  constructor(client, id, aliases = []) {
    /**
     * Any aliases to find this [ArgumentTypeReader]
     * @type {string[]}
     */
    this.aliases = aliases;

    /**
     * The cleitn
     * @type {import('../CommandClient')}
     */
    this.client = client;

    /**
     * The reader's ID
     * @type {string}
     */
    this.id = id;
  }

  /**
   * Abstract function to implement to validate this [ArgumentTypeReader]
   * @param {import('../CommandContext')} ctx The command's context
   * @param {string} arg The raw value
   * @returns {MaybePromise<boolean>}
   */
  validate(ctx, val, arg) {
    throw new SyntaxError(`Method \`validate\` must be overrided in reader ${this.id}`);
  }

  /**
   * Abstract function to parse this [ArgumentTypeReader]
   * @param {import('../CommandContext')} ctx The command's context
   * @param {string} arg The raw value
   * @returns {MaybePromise<T>}
   */
  parse(ctx, val, arg) {
    throw new SyntaxError(`Method \`parse\` must be overrided in reader ${this.id}`);
  }
};

/**
 * @typedef {Promise<T> | T} MaybePromise
 * @template T
 */
