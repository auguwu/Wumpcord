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

const Option = require('./Options');
const Base = require('../entities/base');

/**
 * Represents a parent or subcommand to run a interaction command with Discord
 */
module.exports = class InteractionCommand extends Base {
  /**
   * Creates a new [InteractionCommand] instance
   * @param {InteractionCommandMetadata} data The data supplied from Discord
   */
  constructor(data) {
    super(data.id);

    this.patch(data);
  }

  /**
   * Patches the data
   * @param {InteractionCommandMetadata} data The data supplied from Discord
   */
  patch(data) {
    /**
     * The command's description
     * @type {string}
     */
    this.description = data.description;

    /**
     * The command's options
     * @type {Option[]}
     */
    this.options = !data.options.length ? [] : data.options.map(o => new Option(o));

    /**
     * If the command is a guild command or not
     * @type {boolean}
     */
    this.isGuild = data.is_guild || false;

    /**
     * The name of the command
     * @type {string}
     */
    this.name = data.name;
  }
};
