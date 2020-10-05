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

const { Command } = require('..');

module.exports = class HelpCommand extends Command {
  constructor() {
    super({
      description: 'Grabs a list of Aoba\'s commands or gives documentation of a specific command or module',
      category: 'None',
      aliases: ['halp', 'h', 'cmds', 'commands', '?'],
      args: [
        {
          required: false,
          label: 'cmdOrMod',
          type: 'command|module'
        }
      ],
      name: 'help'
    });
  }

  /**
   * Runs this command
   * @param {import('../CommandContext')} ctx The command's context
   * @param {{ cmdOrMod: string; }} args The command's arguments
   */
  async run(ctx, { cmdOrMod }) {
    return ctx.send(`Found command or module "${cmdOrMod || 'none'}"`);
  }
};
