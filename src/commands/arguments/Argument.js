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
 * Represents a structure class of an [Argument] class.
 *
 * An argument in the API is basically a value can be
 * represented into a value, so let's say we run `!help help`,
 * the raw representation would look like: ["help"]
 *
 * It's just a string value, this base class is
 * to parse that value into a channel, message,
 * etc using the [ArgumentTypeReader] class
 * to validate and parse the argument into
 * what the user wants the argument to be like
 */
module.exports = class Argument {
  /**
   * Creates a new [Argument] instance
   * @param {import('../CommandClient')} client The client
   * @param {ArgumentInfo} info The argument's information
   */
  constructor(client, info) {
    this.constructor._validate(info);

    /**
     * The validator function, if found
     * @type {ValidateFunction}
     */
    this.validator = info.validate !== undefined
      ? info.validate
      : undefined;

    /**
     * If the argument is required or not
     * @type {boolean}
     */
    this.required = info.required || true;

    /**
     * Any default value, if needed
     * @type {any}
     */
    this.default = info.default || undefined;

    /**
     * The parser function, if found
     * @type {ParserFunction}
     */
    this.parser = info.parser !== undefined
      ? info.parser
      : undefined;

    /**
     * Array of items to represent what this [Argument] should be
     * @type {any[]}
     */
    this.oneOf = info.oneOf || [];

    /**
     * The argument's label (name)
     * @type {string}
     */
    this.label = info.label;

    /**
     * The minimum number
     * @type {?number}
     */
    this.min = info.min || undefined;

    /**
     * The maximum number
     * @type {?number}
     */
    this.max = info.max || undefined;

    /**
     * The argument's type
     * @type {import('./ArgumentTypeReader')}
     */
    this.type = this.constructor.determineType(client, info.type);
  }

  /**
   * Determines the type for this [Argument]
   * @param {import('../CommandClient')} client The client
   * @param {string} type The argument's type
   */
  static determineType(client, type) {
    return client.types.find(client, type);
  }

  /**
   * Validates this [Argument]
   * @param {ArgumentInfo} info The argument's information
   */
  static _validate(info) {
    if (typeof info !== 'object' && !Array.isArray(info)) throw new SyntaxError(`Expected \`object\`, received ${typeof info}`);
    if (!info.label || !info.type) throw new TypeError('Missing `label` and/or `type` in [Argument.info]');

    if (typeof info.label !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof info.label}`);
    if (typeof info.type !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof info.type}`);

    if (info.required && typeof info.required !== 'boolean') throw new TypeError(`Expected \`boolean\`, received ${typeof info.required}`);
    if (info.validate && typeof info.validate !== 'function') throw new TypeError(`Expected \`function\`, received ${typeof info.validate}`);
    if (info.parser && typeof info.parser !== 'function') throw new TypeError(`Expected \`function\`, received ${typeof info.parser}`);
    if (info.oneOf && !Array.isArray(info.oneOf)) throw new TypeError(`Expected \`array\`, gotten ${typeof info.oneOf}`);
    if (info.min && typeof info.min !== 'number') throw new TypeError(`Expected \`number\`, gotten ${typeof info.min}`);
    if (info.max && typeof info.max !== 'number') throw new TypeError(`Expected \`number\`, gotten ${typeof info.max}`);
  }

  /**
   * Formats this [Argument] instance
   */
  format() {
    const [prefix, suffix] = [this.required ? '<' : '[', this.required ? '>' : ']'];
    let text = prefix;

    if (this.oneOf) {
      const items = this.oneOf.map(item => item.toString());
      text += `${items.map(i => `"${i}"`).join(' | ')}${suffix}`;

      return text;
    }

    text += this.label;
    text += suffix;

    return text;
  }
};

/**
 * @typedef {(ctx: import('../CommandContext'), arg: string) => boolean} ValidateFunction
 * @typedef {<T>(ctx: import('../CommandContext'), arg: string) => T} ParserFunction
 *
 * @typedef {object} ArgumentInfo
 * @prop {ValidateFunction} [validate] Custom function to validate this [Argument]
 * @prop {boolean} [required=false] If the argument is required or not
 * @prop {any} [default] A default value if the argument isn't presented
 * @prop {ParserFunction} [parser] Custom function to parse this [Argument]
 * @prop {any[]} [oneOf=[]] An array of items to represent what it should be
 * @prop {string} label The argument's label
 * @prop {number} [min=0] The minimum number to use (type must be `int` or `double`)
 * @prop {number} [max=1] The maximum number to use (type must be `int` or `double`)
 * @prop {string} type The type or a union literal type using the pipe syntax
 */
