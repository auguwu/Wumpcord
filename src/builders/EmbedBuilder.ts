/**
 * Copyright (c) 2020-2021 August
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

import type { APIEmbed, APIEmbedAuthor, APIEmbedField, APIEmbedFooter, APIEmbedImage, APIEmbedThumbnail } from 'discord-api-types';
import { omitUndefinedOrNull } from '@augu/utils';
import { Role } from '../entities/Role';

/**
 * Represents a builder class for constucting embeds.
 */
export class EmbedBuilder {
  /**
   * The description of the embed
   */
  public description?: string;

  /**
   * A timestamp in ISO-8601 date format of when this embed was constructed.
   */
  public timestamp?: string;

  /**
   * The thumbnail preview object of this embed.
   */
  public thumbnail?: APIEmbedThumbnail;

  /**
   * The author of this embed.
   */
  public author?: APIEmbedAuthor;

  /**
   * The footer of the embed
   */
  public footer?: APIEmbedFooter;

  /**
   * Any additional fields to add to this embed.
   */
  public fields?: APIEmbedField[];

  /**
   * Image preview object of this embed.
   */
  public image?: APIEmbedImage;

  /**
   * Color of the embed, which will appear on the left side of the embed.
   */
  public color?: number;

  /**
   * The title of the embed.
   */
  public title?: string;

  /**
   * URL preview of the embed, will make the title clickable
   */
  public url?: string;

  /**
   * Represents a builder class for constucting embeds.
   * @param data The data to pre-initialize.
   */
  constructor(data: APIEmbed = {}) {
    this.patch(data);
  }

  /**
   * Patch data for this [[EmbedBuilder]]. (hidden in typings)
   * @param data Any additional data to patch
   */
  patch(data: APIEmbed) {
    if (data.description !== undefined)
      this.description = data.description;

    if (data.thumbnail !== undefined)
      this.thumbnail = data.thumbnail;

    if (data.timestamp !== undefined)
      this.timestamp = data.timestamp;

    if (data.author !== undefined)
      this.author = data.author;

    if (data.fields !== undefined)
      this.fields = data.fields;

    if (data.image !== undefined)
      this.image = data.image;

    if (data.color !== undefined)
      this.color = data.color;

    if (data.title !== undefined)
      this.title = data.title;

    if (data.url !== undefined)
      this.url = data.url;
  }

  /**
   * Sets the description of this embed.
   * @param description The description of an embed. It can be an array of strings
   * and it'll be joined with a new line feed. (`\n`)
   *
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setDescription(description: string | string[]) {
    this.description = Array.isArray(description) ? description.join('\n') : description;
    return this;
  }

  /**
   * Sets a timestamp of the embed.
   * @param stamp ISO8601-formatted date or a JavaScript Date to set the timestamp
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setTimestamp(stamp: Date | string = new Date()) {
    this.timestamp = stamp instanceof Date ? stamp.toISOString() : stamp;
    return this;
  }

  /**
   * Sets a thumbnail preview in this embed.
   * @param thumb The thumbnail URL to set
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setThumbnail(thumb: string) {
    this.thumbnail = { url: thumb };
    return this;
  }

  /**
   * Sets an author in this embed.
   * @param name The name of the author
   * @param url When the name is clicked, this will be the URL they'll be redirected to.
   * @param iconUrl An icon URL to set
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setAuthor(name: string, url?: string, iconUrl?: string) {
    this.author = { name, url, icon_url: iconUrl };
    return this;
  }

  /**
   * Adds a field to this embed.
   *
   * > {{info}}
   * > You can have a max of 25 fields or a [RangeError]({@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError}) will occur.
   * > {{/info}}
   *
   * @param name The title of the field
   * @param value The value, or the content of the field.
   * @param inline If the field should be inlined with it's children or not.
   * @returns This [[EmbedBuilder]] to chain methods
   */
  addField(name: string, value: string, inline: boolean = false) {
    if (this.fields === undefined) this.fields = [];
    if (this.fields.length > 25) throw new RangeError('Maximum amount of fields reached.');

    this.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Adds a blank field to this embed.
   * @param inline If the field should be inlined with it's children.
   * @returns This [[EmbedBuilder]] to chain methods
   */
  addBlankField(inline: boolean = false) {
    return this.addField('\u200b', '\u200b', inline);
  }

  /**
   * Method to add multiple fields to this embed.
   * @param fields Array of field objects to add
   * @returns This [[EmbedBuilder]] to chain methods
   */
  addFields(fields: APIEmbedField[]) {
    for (let i = 0; i < fields.length; i++) this.addField(fields[i].name, fields[i].value, fields[i].inline);

    return this;
  }

  /**
   * Sets the color of the embed, which will be displayed on the left side of the embed
   * @param color A [Role], rgb-value, hexadecimal, or a string or number value to set the color.
   *
   * > {{info}}
   * > - If a [Role] instance is provided, then it'll use the `color` attribute to set the embed colour.
   * > - If this argument is `'random'`, it'll generate a random colour each time this embed builder is constructed.
   * > - If this argument is `'default'`, it'll return black as the colour.
   * > - If this argument is an array of 3 elements, it'll combine all 3 values into a colour.
   * > - If this argument is a string, then it'll convert that hexadecimal value into a number.
   * > - If this argument is a number, it'll be set to that number.
   * > {{/info}}
   *
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setColor(color: string | number | [r: number, g: number, b: number] | Role | 'random' | 'default') {
    if (typeof color === 'number') {
      this.color = color;
      return this;
    }

    if (typeof color === 'string') {
      if (color === 'default') {
        this.color = 0;
        return this;
      }

      if (color === 'random') {
        this.color = Math.floor(Math.random() * (0xFFFFFF + 1));
        return this;
      }

      const int = parseInt(color.replace('#', ''), 16);

      this.color = (int << 16) + (int << 8) + int;
      return this;
    }

    if (Array.isArray(color)) {
      if (color.length > 2) throw new RangeError('RGB value cannot exceed to 3 or more elements');

      const [r, g, b] = color;
      this.color = (r << 16) + (g << 8) + b;

      return this;
    }

    if (color instanceof Role) {
      const int = parseInt(color.hexColour, 16);

      this.color = (int << 24) | (int << 16) | (int << 8);
      return this;
    }

    throw new TypeError(`'color' argument was not a hexadecimal, number, RGB value, 'random', or 'default' (${typeof color})`);
  }

  /**
   * Sets the title of this embed.
   * @param title The title of the embed
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setTitle(title: string) {
    this.title = title;
    return this;
  }

  /**
   * When clicked on the title (if one is set), this URL will be redirected.
   * @param url The URL
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setURL(url: string) {
    this.url = url;
    return this;
  }

  /**
   * The image preview to set for this embed.
   * @param url The URL of the image
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setImage(url: string) {
    this.image = { url };
    return this;
  }

  /**
   * Sets a footer of this embed with some text and optionally
   * a icon url.
   *
   * @param text The text to set
   * @param iconUrl Optionally a icon URL to set as the icon
   * @returns This [[EmbedBuilder]] to chain methods
   */
  setFooter(text: string, iconUrl?: string) {
    this.footer = { text, icon_url: iconUrl };
    return this;
  }

  /**
   * Returns the raw data that this [[EmbedBuilder]] created that is passable
   * when sending messages.
   */
  build() {
    return omitUndefinedOrNull<APIEmbed>({
      description: this.description,
      thumbnail: this.thumbnail,
      timestamp: this.timestamp,
      author: this.author,
      fields: this.fields,
      image: this.image,
      color: this.color,
      title: this.title,
      url: this.url
    });
  }
}
