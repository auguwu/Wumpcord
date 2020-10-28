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
 * The [ArgumentPrompt] class is a prompter to validate all arguments
 * from a [TypeReader] and returns as an object of `{ key: value }`,
 * **key** being the argument key from the argument creation and the
 * **value** being the actual value.
 */
module.exports = class ArgumentPrompt {
  /**
   * Creates a new [ArgumentPrompt] instance
   * @param {import('../Command')} command The command
   * @param {import('../CommandContext')} ctx The command's context
   */
  constructor(command, ctx) {
    /**
     * The command
     * @type {import('../Command')}
     */
    this.command = command;

    /**
     * The command's context
     * @type {import('../CommandContext')}
     */
    this.context = ctx;
  }

  /**
   * Collects the arguments
   * @param {string[]} raw The raw arguments
   * @returns {Promise<ArgumentCollectResult>} The result
   */
  async collect(raw) {
    const collected = {};
    const args = this.command.args;
    const required = args.reduce((uno, dos) => uno + (dos.required ? 1 : 0), 0);

    if (!raw || !raw.length) return { failed: false, collected };

    if (raw.length < required) return {
      reason: 'Little few arguments were present',
      failed: true
    };

    if (raw.length > args.length && !args[args.length - 1].infinite) return {
      reason: 'Too many arguments were present',
      failed: true
    };

    for (let i = 0; i < args.length; i++) {
      const argument = args[i];
      const rawArg = argument.infinite ? raw.slice(i).join(' ') : raw[i];

      const validated = await argument.validate(this.context, rawArg);
      if (!validated) {
        const message = typeof argument.prompts.validatation === 'function'
          ? argument
            .prompts
            .validatation(this.context)
          : argument
            .prompts
            .validatation
            .replace(/[$]user[$]/g, this.context.author.tag)
            .replace(/[$]arg[$]/g, argument.label) || `Validation error occured for argument "${argument.label}", view the command's usage for more information.`;

        const result = {
          reason: message,
          failed: true
        };

        return result;
      }

      try {
        const value = await argument.parse(this.context, rawArg);
        collected[argument.label] = value;
      } catch(ex) {
        console.log(ex);
        return {
          failed: true,
          reason: 'Prompt has ended unexpectedly.'
        };
      }
    }

    return {
      collected,
      failed: false,
      reason: null
    };
  }
};

/**
 * @typedef {object} ArgumentCollectResult
 * @prop {{ [x: string]: any }} collected The actual argument
 * @prop {string} [reason=null] The reason why the argument failed
 * @prop {boolean} failed If the prompt failed
 */
