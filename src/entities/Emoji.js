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

const Base = require('./Base');

module.exports = class Emoji extends Base {
  /**
   * Creates a new [Emoji] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   * @param {EmojiPacket} data The data
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches this [Emoji] instance
   * @param {EmojiPacket} data The data
   */
  patch(data) {
    /**
     * The name of the emoji
     * @type {string}
     */
    this.name = data.name;

    /**
     * If it requires colons (why does this exist)
     * @type {boolean}
     */
    this.requireColons = data.require_colons || false;

    /**
     * If the emoji is managed
     * @type {boolean}
     */
    this.managed = data.managed || false;

    /**
     * If the emoji is animated or not
     * @type {boolean}
     */
    this.animated = data.animated || false;

    /**
     * If the emoji is available or not
     * @type {boolean}
     */
    this.available = data.available || false;

    /**
     * The guild's ID
     * @type {?string}
     */
    this.guildID = data.guild_id;
  }

  /**
   * Returns the guild or `null` if not cached
   */
  get guild() {
    return this.client.guilds.get(this.guildID);
  }

  /**
   * Returns the string representation of the Emoji
   */
  get mention() {
    const prefix = this.animated ? 'a:' : ':';
    return `<${prefix}${this.name}:${this.id}>`;
  }

  toString() {
    return `[Emoji "${this.mention}" (G: ${this.guild ? this.guild.name : null})]`;
  }
};

/**
 * @typedef {object} EmojiPacket
 * @prop {string} name
 * @prop {string} id
 * @prop {boolean} require_colons
 * @prop {boolean} managed
 * @prop {boolean} animated
 * @prop {boolean} available
 * @prop {string} guild_id
 */
