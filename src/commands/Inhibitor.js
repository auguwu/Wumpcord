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
 * Represents a [Inhibitor], which represents a "structure"
 * of a condition statement, like if the command needs
 * to be ran in a guild
 */
module.exports = class Inhibitor {
  /**
   * Creates a new [Inhibitor] instance
   * @param {string} name The name of the inhibitor
   */
  constructor(name) {
    if (!name) throw new TypeError('Missing `name` in [Wumpcord.commands.Inhibitor]');
    if (typeof name !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof name}`);

    /**
     * The name of the inhibitor
     * @type {string}
     */
    this.name = name;
  }

  /**
   * Initialises this [Inhibitor] with the client
   * @param {import('./CommandClient')} client The command's client
   */
  init(client) {
    /**
     * The client instance
     * @type {import('./CommandClient')}
     */
    this.client = client;

    return this;
  }

  /**
   * Abstract function to run when this [Inhibitor] is called
   * @param {import('./CommandContext')} ctx The command's context
   */
  async run(ctx) {
    throw new TypeError(`Missing "run" function in Inhibitor "${this.name}"`);
  }
};
