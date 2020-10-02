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
    
    /**
     * The command's category 
     * @type {?string}
     */
    this.category = info.category || 'None';

    /**
     * The name of the command
     * @type {string}
     */
    this.name = info.name;

    /**
     * The argument list to traverse from
     * @type {Array<(import('./arguments/Argument').ArgumentInfo)>}
     */
    this.args = info.args || [];
  }

  /**
   * Validates this [Command] instance
   * @param {CommandInfo} info The command's information
   */
  static _validate(info) {
    if (typeof info !== 'object' && !Array.isArray(info)) throw new TypeError(`Expecting \`object\`, received ${typeof info}`);
    if (!info.name) throw new TypeError('Missing `name` in `info`');

    if (info.description && (typeof info.description !== 'string' || typeof info.description !== 'function'))
      throw new TypeError(`Expecting \`string\` or \`Function\`, received ${typeof info.description}`);

    if (info.aliases) {
      if (!Array.isArray(info.aliases)) throw new TypeError(`Expecting \`array\`, gotten ${typeof info.description}`);
      if (info.aliases.some(s => typeof s !== 'string')) {
        const items = info.aliases.filter(
          alias => typeof alias !== 'string'
        );

        throw new TypeError(`${items.length} aliases we're not a string`);
      }
    }

    if (info.inhibitors) {
      if (!Array.isArray(info.inhibitors)) throw new TypeError(`Expecting \`array\`, gotten ${typeof info.inhibitors}`);
      if (info.inhibitors.some(s => typeof s !== 'string')) {
        const items = info.inhibitors.filter(inhibitor =>
          typeof inhibitor !== 'string'  
        );

        throw new TypeError(`${items.length} inhibitors we're not a string`);
      }
    }

    if (info.category && typeof info.category !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof info.category}`);
    if (info.args) {
      if (!Array.isArray(info.args)) throw new TypeError(`Expecting \`array\`, gotten ${typeof info.args}`);
      if (info.args.some(s => !Argument._validate(s))) {
        const items = info.args.filter(arg => !Argument._validate(arg));

        const error = new Error(`${items.length} argument didn't pass the validation`);
        error.name = 'ArgumentValidationError';
        error.docs = items.map((arg, index) => `[${index + 1}/${items.length}] "${arg.documentation}"`);

        throw error;
      }
    }
  }

  /**
   * Abstract function to run this [Command]
   * @template T The arguments layout as an object
   * @param {import('./CommandContext')} ctx The command's context
   * @param {T} args The arguments, check with [Wumpcord.commands.CommandContext.isArgsEmpty/1] if they are empty
   * @arity Wumpcord.commands.Command.run/2
   */
  async run(ctx, args) {
    throw new SyntaxError(`Missing run function in ${this.name} (https://docs.augu.dev/wumpcord/errors#missing-run-function)`);
  }

  /**
   * Populates [Command.bot] to this [Command]
   * @param {import('./CommandClient')} bot The client
   */
  init(bot) {
    /**
     * The client instance
     * @type {import('./CommandClient')}
     */
    this.bot = bot;

    return this;
  }

  /**
   * Executes the command
   * @param {import('../entities/Message')} msg The message
   */
  execute(msg) {
    // todo: this
  }

  /**
   * Formats this [Command] to it's actual usage
   */
  format() {
    const prefix = this.bot.getDefaultPrefix(); // returns the first element in the `prefix` array
    const args = this.args.map(arg => {
      const argument = new Argument(arg);
      let prefix = argument.required ? '<' : '[';
      const suffix = argument.required ? '>' : ']';

      prefix += arg.label;
      if (arg.infinite) prefix += '...';
      prefix += suffix;

      return prefix;
    }).join(' ');

    return `${prefix}${this.name} ${args}`;
  }
};

/**
 * @typedef {object} CommandInfo
 * @prop {string} name The command's name
 * @prop {string | ((client: import('./CommandClient')) => string)} description The command's description
 * @prop {string[]} [inhibitors=[]] List of inhibitors to run
 * @prop {string[]} [aliases=[]] Any additional aliases to set this command as
 * @prop {string} [category='none'] The category of the command, will default to `'none'`
 * @prop {import('./arguments/Argument').ArgumentInfo[]} [args=[]] List of arguments that the command has 
 */
