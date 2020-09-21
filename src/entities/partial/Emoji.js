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

module.exports = class PartialEmoji {
  /**
   * Creates a new [Emoji] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   * @param {EmojiPacket} data The data
   */
  constructor(data) {
    this.patch(data);
  }

  /**
   * Patches this [Emoji] instance
   * @param {PartialEmojiPacket} data The data
   */
  patch(data) {
    /**
     * The name of the emoji
     * @type {string}
     */
    this.name = data.name;

    /**
     * If the emoji is animated or not
     * @type {boolean}
     */
    this.animated = data.animated || false;

    /**
     * The ID of the emoji
     * @type {string}
     */
    this.id = data.id || null;
  }

  /**
   * Returns the string representation of the Emoji
   */
  get mention() {
    if (this.id === null) return this.name;

    const prefix = this.animated ? 'a:' : ':';
    return `<${prefix}${this.name}:${this.id}>`;
  }

  toString() {
    return `[PartialEmoji "${this.mention}"]`;
  }
};

/**
 * @typedef {object} PartialEmojiPacket
 * @prop {string} name
 * @prop {string} id
 * @prop {boolean} animated
 */
