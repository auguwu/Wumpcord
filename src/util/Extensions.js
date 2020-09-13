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
 * Represents the structure class for extending API structures,
 * heavily based on Discord.js' Structures API
 * 
 * What it does is: There is a static getter that defines all of the classes
 * appended to this API structure and fetches the data you extended or
 * uses the default class
 * 
 * @example
 * ```js
 * const { Extensions } = require('wumpcord');
 * 
 * Extensions.get('TextChannel'); //> Wumpcord.Entities.TextChannel
 * Extensions.extend('TextChannel', Structure => {
 *   return (class MyTextChannel extends Structure {
 *     constructor(client, data) {
 *       super(client, data);
 *     }
 *     
 *     // Simple getter
 *     get naming() { return this.name; }
 *   });
 * });
 * 
 * Extensions.get('TextChannel'); //> Bot.MyTextChannel
 * ```
 */
module.exports = class Extensions {
  constructor() {
    throw new SyntaxError('Wumpcord.Extensions is not allowed to be initialised with `new`, use the static functions');
  }

  /**
   * Defines all of the extensions so far
   */
  static get extenables() {
    return {};
  }

  /**
   * Gets the extension class
   * @param {string} name The extension name
   * @returns {any} The extension class or `null` if not defined
   * @arity Wumpcord.Extensions/1
   */
  static get(name) {
    return this.extenables.hasOwnProperty(name) ? this.extenables[name] : null;
  }

  /**
   * Extends the extension class
   * @param {string} name The extension name
   * @param {(clazz: any) => any} extendable The function to fetch the extendable
   * @arity Wumpcord.Extensions/2
   */
  static extend(name, extendable) {
    const Extension = this.get(name);
    if (Extension === null) throw new TypeError(`Extension "${name}" is not an extendable`);

    const extended = extendable(Extension);
    this.extenables[name] = extended;
  }
};
