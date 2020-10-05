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

const { Collection } = require('@augu/immutable');
const toLower = (s) => s.toLowerCase();

/**
 * Represents a "module" of a group of commands
 */
module.exports = class Module {
  /**
   * Creates a new [Module] instance
   * @param {string} name The module's name
   */
  constructor(name) {
    /**
     * The commands in this module
     * @type {Collection<import('./Command')>}
     */
    this.commands = new Collection();

    /**
     * The name of the module
     * @type {string}
     */
    this.name = name;
  }

  /**
   * Finds a list of commands by this module
   * @param {'exact' | 'inexact'} type The type to traverse from
   * @param {string} name The name or alias of the command
   * @returns {Array<import('./Command')>} Array of commands found
   */
  findCommands(type, name) {
    if (!['exact', 'inexact'].includes(type)) throw new TypeError(`Invalid filter "${type}"`);

    /** @type {((command: import('./Command')) => boolean)} */
    let filter;

    switch (type) {
      case 'inexact':
        filter = (command) => command.name.toLowerCase().includes(name.toLowerCase()) || command.aliases.map(toLower).includes(name.toLowerCase());
        break;

      case 'exact':
        filter = (command) => command.name.toLowerCase() === name || command.aliases.some(alias => alias.toLowerCase() === name);
        break;

      default:
        filter = undefined;
        break;
    }

    if (filter === undefined) return [];
    else return this.commands.filter(filter);
  }
};
