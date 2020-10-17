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
/* eslint-disable camelcase */

const Util = require('../../util/Util');

/**
 * Represents a builder to create embeds and sends them
 * directly to Discord
 */
module.exports = class EmbedBuilder {
  /**
   * Creates a new [EmbedBuilder] instance
   * @param {Embed} [data] Any data to add or not
   */
  constructor(data = {}) {
    /**
     * The description of the embed
     * @type {string}
     */
    this.description = data.description;

    /**
     * The title of the embed
     * @type {string}
     */
    this.title = data.title;

    /**
     * The author of the embed
     * @type {EmbedAuthor}
     */
    this.author = data.author;

    /**
     * The thumbnail of the embed
     * @type {EmbedThumbnail}
     */
    this.thumbnail = data.thumbnail;

    /**
     * The fields of the embed
     * @type {EmbedField[]}
     */
    this.fields = data.fields.map(Util.clone);

    /**
     * The image that the embed will display
     * @type {EmbedImage}
     */
    this.image = data.image;

    /**
     * The timestamp of the embed
     * @type {Date}
     */
    this.timestamp = data.timestamp;

    /**
     * The footer of the embed
     * @type {EmbedFooter}
     */
    this.footer = data.footer;

    /**
     * The color of the embed
     * @type {number}
     */
    this.color = data.color;

    /**
     * The type of embed
     * @type {'rich'}
     */
    this.type = data.type || 'rich';

    /**
     * The URL of the embed that will embed on the title
     * @type {string}
     */
    this.url = data.url;
  }

  /**
   * Sets the title of the embed
   * @param {string} title The title
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  setTitle(title) {
    this.title = title;
    return this;
  }

  /**
   * Sets the description of the embed
   * @param {StringResolvable} description The description of the embed
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  setDescription(description) {
    this.description = Util.resolveString(description);
    return this;
  }

  /**
   * Sets the author of the embed
   * @param {string} name The name of the author
   * @param {string} [url] The URL to embed on the author when clicking it
   * @param {string} [iconUrl] The icon URL to show when looking at it
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  setAuthor(name, url, iconUrl) {
    this.author = { name, url, icon_url: iconUrl };
    return this;
  }

  /**
   * Sets the thumbnail of the embed
   * @param {string} url The URL to set
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  setThumbnail(url) {
    this.thumbnail = url;
    return this;
  }

  /**
   * Adds a singular field to the embed
   * @param {string} name The name of the field
   * @param {string} value The value to put below the name
   * @param {boolean} [inline=false] If we should inline it or not
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  addField(name, value, inline = false) {
    if (this.fields.length > 25) throw new RangeError('Reached the maximum amount of fields to add');

    this.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Adds mutiple fields to the embed
   * @param {EmbedField[]} fields The fields to add
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  addFields(fields) {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      this.addField(field.name, field.value, field.inline || false);
    }

    return this;
  }

  /**
   * Adds a blank field to the embed
   * @param {boolean} [inline=false] If we should inline the field
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  addBlankField(inline = false) {
    return this.addField('\u200b', '\u200b', inline);
  }

  /**
   * Adds an image to the embed
   * @param {string} url The URL of the image
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  addImage(url) {
    this.image = { url };
    return this;
  }

  /**
   * Adds a timestamp to the embed
   * @param {Date | number} [timestamp] The timestamp to add
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  addTimestamp(timestamp = new Date()) {
    this.timestamp = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    return this;
  }

  /**
   * Sets a footer
   * @param {string} txt The text
   * @param {string} [iconURL] The icon url
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  setFooter(txt, iconURL) {
    this.footer = { text: txt, icon_url: iconURL };
    return this;
  }

  /**
   * Sets the url
   * @param {string} url The URL
   * @returns {EmbedBuilder} This embed builder to chain methods
   */
  setURL(url) {
    this.url = url;
    return this;
  }

  /**
   * Builds out the embed to a sendable object
   * @returns {Embed} The embed
   */
  build() {
    return {
      title: this.title,
      description: this.description,
      type: 'rich',
      fields: this.fields,
      author: this.author ? this.author : undefined,
      image: this.image ? this.image : undefined,
      footer: this.footer ? this.footer : undefined,
      color: this.color,
      url: this.url ? this.url : undefined,
      timestamp: this.timestamp ? this.timestamp.toISOString() : undefined,
      thumbnail: this.thumbnail ? this.thumbnail : undefined
    };
  }
};

/**
 * @typedef {import('../../Util/Util').Resolvable<string>} StringResolvable
 * @typedef {Object} Embed
 * @prop {string} [title] The title
 * @prop {string} [description] The description
 * @prop {EmbedAuthor} [author] The author
 * @prop {EmbedThumbnail} [thumbnail] The thumbnail
 * @prop {EmbedField[]} [fields] The fields
 * @prop {EmbedImage} [image] The image
 * @prop {number} [timestamp] The timestamp
 * @prop {EmbedFooter} [footer] The footer
 * @prop {number} [color] The color
 * @prop {'rich'} [type] The type
 * @param {string} [url] The url
 *
 * @typedef {Object} EmbedAuthor
 * @prop {string} name The name
 * @prop {string} [url] The URL
 * @prop {string} [icon_url] The icon URL
 *
 * @typedef {Object} EmbedThumbnail
 * @prop {string} [url] The url
 *
 * @typedef {Object} EmbedImage
 * @prop {string} [url] The URL
 *
 * @typedef {Object} EmbedField
 * @prop {string} name The name
 * @prop {string} value The value
 * @prop {string} [inline] The inline boolean
 *
 * @typedef {Object} EmbedFooter
 * @prop {string} text The text
 * @prop {string} [icon_url] The icon URL
 */
