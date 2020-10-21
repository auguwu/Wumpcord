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

const { Collection } = require('@augu/immutable');
const UnionTypeReader = require('../types/UnionTypeReader');
const readers = require('../types');

/**
 * Represents the handler for parsing type readers
 * @extends {Collection<import('../arguments/ArgumentTypeReader')>}
 */
module.exports = class ArgumentTypeReaderHandler extends Collection {
  /**
   * Creates a new [ArgumentTypeReaderHandler] instance
   * @param {import('../CommandClient')} client The command's client
   */
  constructor(client) {
    super();

    this.client = client;
  }

  /**
   * Registers all default type readers
   */
  registerDefaults() {
    for (let i = 0; i < readers.length; i++) {
      const TypeReader = readers[i];
      const reader = new TypeReader(this.client);

      this.set(reader.id, reader);
    }
  }

  /**
   * Find a reader by it's ID
   * @param {string} type The ID of the type
   */
  find(type) {
    if (!type) return undefined;
    if (!type.includes('|')) return this.get(type);

    let cls = this.get(type);
    if (cls) return cls;

    return this.emplace(type, new UnionTypeReader(this.client, type));
  }
};
