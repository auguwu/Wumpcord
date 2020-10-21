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

const ArgumentTypeReader = require('../arguments/ArgumentTypeReader');

/**
 * Represents a union type reader
 * @template T: The union types
 * @extends {ArgumentTypeReader<T>}
 */
module.exports = class UnionTypeReader extends ArgumentTypeReader {
  /**
   * Creates a new [UnionTypeReader] instance
   * @param {import('../../CommandClient')} client The client
   * @param {string} type The types
   */
  constructor(client, type) {
    super(client, type);

    /**
     * The types
     * @type {(import('../ArgumentTypeReader')<any>)[]}
     */
    this.types = [];

    const ids = type.split('|');
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!client.types.has(id)) throw new TypeError(`Type "${id}" doesn't exist`);

      this.types.push(client.types.get(id));
    }
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} arg The raw value
   * @returns {MaybePromise<boolean>}
   */
  validate(ctx, arg) {
    const results = this.types.map(type => type.validate(ctx, arg));
    return results.some(Boolean);
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} arg The raw value
   * @returns {MaybePromise<T>}
   */
  parse(ctx, arg) {
    const results = this.types.map(type => type.parse(ctx, arg));
    for (let i = 0; i < results.length; i++) {
      if (results[i]) return this.types[i].parse(ctx, arg);
    }

    throw new TypeError(`Unable to parse "${arg}" with union ${this.id}`);
  }
};

/**
 * @typedef {import('../arguments/ArgumentTypeReader').MaybePromise<T>} MaybePromise
 * @template T
 */
