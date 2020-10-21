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
const { isPromise } = require('../util');

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
   * @param {{ cmdOrMod: import('../Command') | import('../Module') }} args The command's arguments
   */
  async run(ctx, { cmdOrMod }) {
    if (!cmdOrMod) {
      const commands = this.bot.commands.filter(async command => {
        let result;
        for (let i = 0; i < command.inhibitors.length; i++) {
          const inhibitor = this.bot.inhibitors.get(command.inhibitors[i]);
          result = isPromise(inhibitor.run) ? await inhibitor.run(ctx) : inhibitor.run(ctx);
        }

        return result;
      });

      const embed = {
        title: `${this.bot.user.tag} | Commands List`,
        description: `View a command or module's documentation using **${this.bot.getDefaultPrefix()}help <command>**, where \`<command>\` is the command you wanna execute from the list`,
        fields: [],
        color: 0x470B4D
      };

      const categories = {};
      for (const command of commands) {
        if (!categories.hasOwnProperty(command.category)) categories[command.category] = [];
        categories[command.category].push(command.name);
      }

      for (const cat in categories) {
        embed.fields.push({
          name: `${cat} [${categories[cat].length}]`,
          value: categories[cat].map(s => `\`${s}\``).join(', ') || 'None',
          inline: false
        });
      }

      return ctx.send({ embed });
    } else {
      const isModule = cmdOrMod.commands !== undefined;
      if (isModule) {
        const embed = {
          title: `[ Module ${cmdOrMod.name} ]`,
          description: []
        };

        for (const command of cmdOrMod.commands.values()) embed.description.push(`-> **${command.format()}: ${command.description}**`);

        return ctx.send({
          embed: {
            title: embed.title,
            description: embed.description.join('\n'),
            color: 0x470B4D
          }
        });
      } else {
        return ctx.send({
          embed: {
            title: `[ Command ${cmdOrMod.name} ]`,
            description: [
              `> :pencil2: **| ${cmdOrMod.description}**`,
              '',
              '```apache',
              `Usage: ${cmdOrMod.format()}`,
              '```'
            ].join('\n'),
            color: 0x470B4D
          }
        });
      }
    }
  }
};
