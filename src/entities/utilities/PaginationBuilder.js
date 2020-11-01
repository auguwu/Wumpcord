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
const ReactionCollector = require('./ReactionCollector');

/**
 * Represents a PaginationBuilder, to create pagination embeds.
 */
module.exports = class PaginationBuilder {
  /**
   * Creates a new [PaginationBuilder] instance
   * @param {import('../Message')} message The message to use
   * @param {PaginationBuilderOptions} options The options to use
   */
  constructor(message, options) {
    if (!message.client.hasIntent('guildMessageReactions')) throw new TypeError('Missing "Guild Message Reactions" intent');

    /**
     * The invoked message to receive updates on
     * @type {import('../Message')}
     */
    this.invoked = message;

    /**
     * The pages to send when switching
     * @type {Array<string | import('./EmbedBuilder').Embed | import('./EmbedBuilder')>}
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
     * @type {string}
     */
    this.trashEmoji = Util.get('trashEmoji', '🗑️', options);

    /**
     * The first page emoji, to forward to the first page
     * @type {string | undefined}
     */
    this.firstPageEmoji = Util.get('firstPageEmoji', undefined, options);

    /**
     * The last page emoji, to forward to the last page
     * @type {string | undefined}
     */
    this.lastPageEmoji = Util.get('lastPageEmoji', undefined, options);

    /**
     * The backward page emoji, to forward to the last page of the current page
     * @type {string | undefined}
     */
    this.backwardPageEmoji = Util.get('backPageEmoji', undefined, options);

    /**
     * The forward page emoji, to forward to the next page from the current page
     * @type {string | undefined}
     */
    this.forthPageEmoji = Util.get('forthPageEmoji', undefined, options);

    /**
     * The current page to switch to
     * @type {number}
     */
    this.current = 0;

    /**
     * If we are on-going this [PaginationBuilder] instance
     * @type {boolean}
     */
    this.ongoing = false;

    /**
     * Maxmium page load to use for the current user
     * @type {number}
     */
    this.maxMatches = Util.get('maxMatches', Infinity, options);

    /**
     * If we should show the page numbers
     * @type {boolean}
     */
    this.showPageNumbers = Util.get('show', false, options);

    if (options.timeout) {
      /**
       * Timer to close this [PaginationBuilder] instance
       * @type {NodeJS.Timeout}
       */
      this._timeout = setTimeout(() => {
        this.end('time');
      }, options.timeout);

      this._timeout.unref();
    }
  }

  /**
   * Initialises a new prompt for this [PaginationBuilder] instance
   */
  async init() {
    if (!this.pages.length) throw new TypeError('Missing pages to show, use [PaginationEmbed.addPage] or add some in the constructor.');
    if (this.current > this.pages.length) throw new TypeError(`You can't view this current page, only from 0 -> ${this.pages.length}`);
    if (this.timeout > 900000) throw new SyntaxError('Timeout can\'t be no longer than 15 minutes.');
    if (this.maxMatches !== Infinity && this.maxMatches > 1500) throw new SyntaxError('Maxmium page load can\'t be higher than 1,500 pages per concurrent embed.');

    const page = this.pages[this.current - 1];
    const content = {
      embed: typeof page === 'object' ? page : undefined,
      content: typeof page === 'string'
        ? page
        : this.showPageNumbers
          ? `[ Viewing page **${this.current}/${this.pages.length}** ]`
          : ''
    };

    if (this.invoked.author.id === this.invoked.client.user.id) {
      /**
       * The message to receive updates on
       * @type {import('../Message')}
       */
      this.message = await this.invoked.edit(content);
    } else {
      /**
       * The message to receive updates on
       * @type {import('../Message')}
       */
      this.message = await this.invoked.channel.send(content);
    }

    if (this.firstPageEmoji !== undefined) await this.message.react(this.firstPageEmoji);
    if (this.forthPageEmoji !== undefined) await this.message.react(this.forthPageEmoji);
    if (this.lastPageEmoji !== undefined) await this.message.react(this.lastPageEmoji);
    if (this.backPageEmoji !== undefined) await this.message.react(this.backPageEmoji);
    await this.message.react(this.trashEmoji);

    /**
     * The reaction handler to use
     */
    this.reactions = new ReactionCollector(message, (m) => m.author.id === this.invoker.author.id);
    this.ongoing = true;
  }

  /**
   * Adds a page to this [PaginationBuilder] instance if we aren't ongoing
   * @param {string | import('./EmbedBuilder').Embed | import('./EmbedBuilder')} page The page to add
   * @returns {this} This instance to chain methods
   */
  addPage(page) {
    if (this.ongoing) return;

    const p =
      typeof page === 'string'
        ? page
        : page instanceof EmbedBuilder
          ? page.build()
          : page;

    this.pages.push(p);
    return this;
  }

  /**
   * Check if we have permissions to remove the reaction
   */
  hasPermission() {
    return this.message.guild !== undefined && this.message.channel.permissionsOf(this.message.client.user.id).has('manageMessages');
  }

  /**
   * Updates the message with the page
   */
  update() {
    const page = this.pages[this.current - 1];
    this.message.edit({
      embed: typeof page === 'object' ? page : undefined,
      content: typeof page === 'string'
        ? page
        : this.showPageNumbers
          ? `[ Viewing page **${this.current}/${this.pages.length}** ]`
          : ''
    });
  }

  /**
   * Runs the actual pagination builder
   */
  run() {
    this.reactions.on('react', (message, user, emoji) => {
      console.log(emoji);
    });
  }
};

/**
 * @typedef {object} PaginationBuilderOptions
 * @prop {string} [firstPageEmoji='⏮'] The first page emoji to use, if none is specified, it'll default to ⏮
 * @prop {string} [forthPageEmoji='➡'] The forth page emoji to use, if none is specified, it'll default to ➡
 * @prop {string} [lastPageEmoji='⏭'] The last page emoji to use, if none is specified, it'll default to ⏭
 * @prop {string} [backPageEmoji='⬅'] The back page emoji to use, if none is specified, it'll default to ⬅
 * @prop {number} [maxMatches=Infinity] The maxmium page load to use
 * @prop {string} [trashEmoji='🗑️'] The trash emoji to dispose this [PaginationBuilder], if it's not specified it'll not dispose itself
 * @prop {number} [timeout=60000] The timeout to dipose this [PaginationBuilder] instance
 * @prop {boolean} [show=false] If we should show the page numbers or not
 * @prop {Array<string | import('./EmbedBuilder') | import('./EmbedBuilder').Embed>} [pages] The pages to add
 */
