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

const EmbedBuilder = require('./EmbedBuilder');
const Util = require('../../util/Util');

/**
 * Represents a PaginationBuilder, to create pagination embeds.
 */
module.exports = class PaginationBuilder {
  /**
   * Creates a new [PaginationBuilder] instance
   * @param {import('..').TextableChannel} channel The textable channel to use
   * @param {PaginationBuilderOptions} options The options to use
   */
  constructor(channel, options) {
    /**
     * The textable channel to send it to
     * @type {import('..').TextableChannel}
     */
    this.channel = channel;

    /**
     * The pages to send when switching
     * @type {string | import('./EmbedBuilder').Embed}
     */
    this.pages = options.pages.map(embed => {
      if (typeof embed === 'string') return embed;
      else if (embed instanceof EmbedBuilder) return embed.build();
      else return embed;
    });

    /**
     * The timeout to dipose this [PaginationBuilder] instance
     * @type {number}
     */
    this.timeout = Util.get('timeout', 60000, options);

    /**
     * The trash emoji to use to dispose this [PaginationBuilder] instance.
     * If none is specified, it will not dispose one
     *
     * @type {string | undefined}
     */
    this.trashEmoji = Util.get('trashEmoji', undefined, options);
  }
};

/**
 * @typedef {object} PaginationBuilderOptions
 * @prop {string} [firstPageEmoji='⏮'] The first page emoji to use, if none is specified, it'll default to ⏮
 * @prop {string} [forthPageEmoji='➡'] The forth page emoji to use, if none is specified, it'll default to ➡
 * @prop {string} [lastPageEmoji='⏭'] The last page emoji to use, if none is specified, it'll default to ⏭
 * @prop {string} [backPageEmoji='⬅'] The back page emoji to use, if none is specified, it'll default to ⬅
 * @prop {string} [trashEmoji] The trash emoji to dispose this [PaginationBuilder], if it's not specified it'll not dispose itself
 * @prop {number} [timeout=60000] The timeout to dipose this [PaginationBuilder] instance
 * @prop {Array<string | import('./EmbedBuilder') | import('./EmbedBuilder').Embed>} [pages] The pages to add
 */
