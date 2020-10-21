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
const Regex = /^(?:<a?:([a-zA-Z0-9_]+):)?([0-9]+)>?$/;

/**
 * @extends {ArgumentTypeReader<import('../../../entities/Emoji')>}
 */
module.exports = class EmojiTypeReader extends ArgumentTypeReader {
  constructor(client) {
    super(client, 'emoji', ['emote']);
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} val The raw value
   * @param {import('../../arguments/Argument')} arg The argument
   * @returns {MaybePromise<boolean>}
   */
  validate(ctx, val, arg) {
    // If we are in a guild
    if (!ctx.guild) return false;

    // If we can cache emojis
    if (!this.client.canCache('emoji')) return false;

    const matches = val.match(Regex);
    if (matches && ctx.guild.emojis.has(matches[2])) return true;

    // Let's find it by name (if it's included)
    const match = ctx.guild.emojis.filter(emote => emote.name.toLowerCase().includes(val.toLowerCase()));
    if (match.length) return true;

    // Let's find it by exact match
    const match2 = ctx.guild.emojis.filter(emote => emote.name.toLowerCase() === val.toLowerCase());
    if (match2.length) return true;

    // No matches found, let's just not :pensive:
    return false;
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} val The raw value
   * @param {import('../../arguments/Argument')} arg The argument
   * @returns {MaybePromise<import('../../../entities/Emoji')>}
   */
  parse(ctx, val, arg) {
    // Find it by RegExp
    const matches = val.match(Regex);
    if (matches && ctx.guild.emojis.has(matches[2])) return ctx.guild.emojis.get(matches[2]) || null;

    // Let's find it by name (if it's included)
    const match = ctx.guild.emojis.filter(emote => emote.name.toLowerCase().includes(val.toLowerCase()));
    if (match.length) return match[0];

    // Let's find it by exact match
    const match2 = ctx.guild.emojis.filter(emote => emote.name.toLowerCase() === val.toLowerCase());
    if (match2.length) return match2[0];

    // Let's not do anything if not found
    return null;
  }
};

/**
 * @typedef {import('../../arguments/ArgumentTypeReader').MaybePromise<T>} MaybePromise
 * @template T
 */
