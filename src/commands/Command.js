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
 * Represents a [Command] to execute when a user has typed out a command
 */
module.exports = class Command {
  /**
   * Creates a new [Command] instance
   * @param {CommandInfo} info The command's information
   */
  constructor(info) {
    this.constructor._validate(info);

    /**
     * The command's description
     * @type {string | ((client: import('./CommandClient')) => string)}
     */
    this.description = info.description;

    /**
     * List of inhibitors to run
     * @type {string[]}
     */
    this.inhibitors = info.inhibitors || [];

    /**
     * List of aliases to set this command has
     * @type {string[]}
     */
    this.aliases = info.aliases || [];
  }
};

/**
 * @typedef {object} CommandInfo
 * @prop {string} name The command's name
 * @prop {string | ((client: import('./CommandClient')) => string)} description The command's description
 * @prop {string | ((command: Command) => string)} [usage=''] The command's usage
 * @prop {string[]} [inhibitors=[]] List of inhibitors to run
 * @prop {string[]} [aliases=[]] Any additional aliases to set this command as
 * @prop {string} [category='none'] The category of the command, will default to `'none'`
 */
