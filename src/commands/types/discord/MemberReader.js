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
const Regex = /^(?:<@!?)?([0-9]+)>?$/;

/**
 * Represents a union type reader
 * @extends {ArgumentTypeReader<import('../../../entities/GuildMember')>}
 */
module.exports = class EmojiTypeReader extends ArgumentTypeReader {
  constructor(client) {
    super(client, 'member');
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} arg The raw value
   * @returns {MaybePromise<boolean>}
   */
  async validate(ctx, arg) {
    const matches = arg.match(Regex);
    if (matches) {
      try {
        const member = await this.client.fetchMember(await this.client.fetchUser(matches[1]));
      }
    }
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} arg The raw value
   * @returns {MaybePromise<import('../../../entities/Emoji')>}
   */
  parse(ctx, arg) {

  }
};

/**
 * @typedef {import('../../arguments/ArgumentTypeReader').MaybePromise<T>} MaybePromise
 * @template T
 */
