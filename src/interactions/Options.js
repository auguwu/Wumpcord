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

/**
 * Represents a option of a [InteractionCommand] instance
 */
module.exports = class CommandInteractionOption {
  /**
   * Creates a new [CommandInteractionOption] instance
   * @param {CommandInteractionOptionMetadata} data The data supplied from Discord
   */
  constructor(data) {
    /**
     * The option's description
     * @type {string}
     */
    this.description = data.description;

    /**
     * If the option is required or not
     * @type {boolean}
     */
    this.required = data.required || false;

    /**
     * The choices available
     * @type {CommandInteractionOptionChoice[]}
     */
    this.choices = data.choices || [];

    /**
     * The options of this command
     * @type {CommandInteractionOption[]}
     */
    this.options = data.options?.map(option => new this.constructor(option)) ?? [];

    /**
     * The first required option for the user to complete
     * @type {boolean}
     */
    this.default = data.default || false;

    /**
     * The name of the option
     * @type {string}
     */
    this.name = data.name;

    /**
     * The option's type
     * @type {string}
     */
    this.type = data.type;
  }
};
