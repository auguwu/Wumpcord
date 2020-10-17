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

const Permissions = require('../util/Permissions');
const Base = require('./Base');

module.exports = class Role extends Base {
  /**
   * Creates a new [Role] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   * @param {RolePacket} data The role packet
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The guild ID
     * @type {?string}
     */
    this.guildID = data.guild_id;

    this.patch(data);
  }

  /**
   * Patches this [Role] instance
   * @param {RolePacket} data The data
   */
  patch(data) {
    /**
     * The position of the role
     * @type {number}
     */
    this.position = data.position;

    /**
     * The permissions
     * @type {Permissions}
     */
    this.permissions = new Permissions(data.permissions);

    /**
     * If the role is mentionable or not
     * @type {boolean}
     */
    this.mentionable = data.mentionable || false;

    /**
     * If the role is managed or not
     * @type {boolean}
     */
    this.managed = data.managed || false;

    /**
     * If the role is hoisted or not
     * @type {boolean}
     */
    this.hoisted = data.hoist || false;

    /**
     * The color of the role
     * @type {number}
     */
    this.color = data.color || 0;

    /**
     * The name of the role
     * @type {string}
     */
    this.name = data.name;
  }

  /**
   * Gets the hexadecimal version of the color of the role
   * @returns {?string} `null` if the color is black
   */
  get hex() {
    if (this.color === 0) return null;
    return parseInt(this.color).toString(16);
  }

  /**
   * Gets the RGB of the color by it's hex
   * @returns {[number, number, number]} Returns the RGB colors by an Array of 3
   */
  // Credit: https://stackoverflow.com/a/5624139
  get rgb() {
    if (this.color === 0) return [];

    let items = [];
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.hexColor);
    if (result) items.concat([parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]);

    return items;
  }

  /**
   * Returns the guild or `null` if not cached
   */
  get guild() {
    return this.client.guilds.get(this.guildID) || null;
  }

  toString() {
    return `[Role "${this.name}" (G: ${this.guild ? this.guild.name : 'unknown'})]`;
  }
};

/**
 * @typedef {object} RolePacket
 * @prop {number} position
 * @prop {number} permissions
 * @prop {string} name
 * @prop {boolean} mentionable
 * @prop {booleam} managed
 * @prop {string} id
 * @prop {boolean} hoist
 * @prop {number} color
 */
