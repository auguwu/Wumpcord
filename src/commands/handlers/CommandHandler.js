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
const CooldownBucket = require('../cooldowns/CooldownBucket');
const ArgumentPrompt = require('../arguments/ArgumentPrompt');
const Context = require('../CommandContext');
const Module = require('../Module');
const toLower = s => s.toLowerCase();

const {
  posix: { join }
} = require('path');

const {
  fs: {
    readdir,
    lstat
  }
} = require('../util');


/**
 * Represents the [CommandHandler], to add & run commands
 *
 * @extends {Collection<import('../Command')>}
 */
module.exports = class CommandHandler extends Collection {
  /**
   * Creates a new [CommandHandler] instance
   * @param {import('../CommandClient')} client The command client
   * @param {string | Array<import('../CommandClient').Class<import('../Command')>>} directory The directory or the commands to load at runtime
   */
  constructor(client, directory) {
    super();

    /**
     * The directory or `null` if it's not a string
     * @type {string | Array<import('../CommandClient').Class<import('../Command')>>}
     */
    this.directory = directory;

    /**
     * The modules available
     * @type {Collection<import('../Module')>}
     */
    this.modules = new Collection();

    /**
     * The cooldown bucket
     * @type {CooldownBucket}
     */
    this.cooldowns = new CooldownBucket();

    /**
     * The command client
     * @private
     * @type {import('../CommandClient')}
     */
    this.client = client;
  }

  /**
   * Asynchronously loads the commands if it's in a directory
   */
  async load() {
    if (Array.isArray(this.directory)) {
      this.client.emit('debug', `Now initialising ${this.directory.length} commands...`);
      for (let i = 0; i < this.directory.length; i++) {
        const cls = this.directory[i];
        const command = new cls();

        const mod = this.modules.emplace(command.category, new Module(command.category));
        const c = command.init(this.client);

        mod.commands.set(c.name, c);
        this.set(c.name, c);
        this.client.emit('command.registered', c);
      }

      this.client.emit('debug', `Loaded ${this.size} inhibitors!`);
      return;
    }

    const stats = await lstat(this.directory);
    if (!stats.isDirectory()) {
      this.client.emit('error', new Error(`Directory "${this.directory}" was not a directory (https://docs.augu.dev/Wumpcord/errors#not-a-directory)`));
      return;
    }

    const modules = await readdir(this.directory);
    if (!modules.length) {
      this.client.emit('error', new Error(`No modules were added in directory "${this.directory}"`));
      return;
    }

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const files = await readdir(join(this.directory, module));

      if (!files.length) {
        this.client.emit('error', new Error(`Module "${module}" didn't include any files`));
        continue;
      }

      for (let j = 0; j < files.length; i++) {
        const Command = files[j];
        const cls = require(join(this.directory, module, Command));

        /** @type {import('../Command')} */
        const command = cls.default ? new cls.default() : new cls();
        const list = this.modules.emplace(module, new Module(module));

        command.init(this.client);
        command.category = module;

        list.commands.set(command.name, command);
        this.set(command.name, command);

        this.client.emit('command.registered', command);
        this.client.emit('debug', `Initialised command "${command.name}"`);
      }
    }

    this.client.emit('debug', `Loaded ${this.size} commands in ${this.modules.size} modules.`);
  }

  /**
   * Handles an edited message on Discord, check if it's a command
   * @param {?import('../../entities/Message')} old The old message
   * @param {import('../../entities/Message')} msg The new message
   */
  async handleEditedMessage(old, msg) {
    if (old === null) return; // it can return null if not cached

    // cache the guild, if needed
    await msg.getGuild();

    // Can be used for publishing messages
    if (old.content === msg.content) return;

    return this.handle(msg);
  }

  /**
   * Handles the handler itself
   * @param {import('../../entities/Message')} msg The message
   */
  async handle(msg) {
    // Only non-edited messages need this
    if (msg.guild === null) await msg.getGuild();

    // If the message author is a bot or is System
    if (msg.author.system || msg.author.bot) return;

    // Let's get the prefixes
    const mention = new RegExp(`<@!${this.client.user.id}> `).exec(msg.content);
    const prefixes = this.client.prefixes.filter(Boolean);
    let prefix = null;

    // Let's filter out any `undefined` stuff
    if (mention !== null) prefixes.push(`${mention}`); // add the mention as a prefix if was added to the message

    // Let's traverse through it and check
    for (let i = 0; i < prefixes.length; i++) {
      if (msg.content.startsWith(prefixes[i])) {
        prefix = prefixes[i];
        break; // break the execution context
      }
    }

    // Let's not do anything if the prefix is null
    if (prefix === null) return;

    // Now let's get the command and the args
    const args = msg.content.slice(prefix.length).split(/ +/g);
    const name = args.shift();
    const commands = this.filter(cmd =>
      cmd.name === name || (cmd.aliases || []).includes(cmd)
    );

    // Check if the command is `null`
    if (!commands.length) return;

    const command = commands[0];
    const context = new Context(this.client, msg);
    const failed = [];

    // Now we check for any conditional logic with Inhibitors
    for (const inhibitor of command.inhibitors) {
      const i = this.client.inhibitors.get(inhibitor);
      if (!i) continue;

      const ran = await i.run(context);
      if (!ran) failed.push(i.name);
    }

    if (failed.length) {
      /**
       * Emitted when the user has failed a check
       * @fires inhibitor.failed
       * @param {CommandContext} ctx The command's context
       * @param {Inhibitor[]} failed How many inhibitors failed
       */
      this.client.emit('inhibitor.failed', context, failed);
      return;
    }

    // Now we check for args!
    const prompt = new ArgumentPrompt(command, context);
    const allArgs = await prompt.collect(args);

    if (allArgs.failed) {
      console.trace('failed argument check');

      /**
       * Emitted when the argument has failed to parse
       * @fires argument.failed
       * @param {CommandContext} ctx The command's context
       * @param {ArgumentCollectResult} result The result
       */
      this.client.emit('argument.failed', context, allArgs);
      return;
    }

    // Now we check for cooldowns
    const token = this.cooldowns.check(command, context);
    if (token && token.throttled) {
      /**
       * Emitted when the user has hit the cooldown
       * @fires command.cooldown
       * @param {CooldownToken} token The token
       */
      this.client.emit('command.cooldown', context, token);
      return;
    }

    try {
      await command.run(context, allArgs.collected);
    } catch(ex) {
      const error = new Error(ex.message);
      error.name = 'CommandError';
      error.stack = ex.stack;

      this.client.emit('command.error', context, command, error);
    }
  }

  /**
   * Finds a list of commands by a filter
   * @param {'exact' | 'inexact'} type The type to traverse from
   * @param {string} name The name or alias of the command
   * @returns {Array<import('../Command')>} Array of commands found
   */
  findCommands(type, name) {
    if (!['exact', 'inexact'].includes(type)) throw new TypeError(`Invalid filter "${type}"`);

    /** @type {((command: import('../Command')) => boolean)} */
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
    else return this.filter(filter);
  }

  /**
   * Finds a list of modules by the filter
   * @param {'exact' | 'inexact'} type The type to traverse from
   * @param {string} name The name or alias of the command
   * @returns {Array<import('../Module')>} Array of commands found
   */
  findModules(type, name) {
    if (!['exact', 'inexact'].includes(type)) throw new TypeError(`Invalid filter "${type}"`);

    /** @type {((mod: import('../Module')) => boolean)} */
    let filter;

    switch (type) {
      case 'inexact':
        filter = (mod) => mod.name.toLowerCase().includes(name.toLowerCase());
        break;

      case 'exact':
        filter = (mod) => mod.name.toLowerCase() === name;
        break;

      default:
        filter = undefined;
        break;
    }

    if (filter === undefined) return [];
    else return this.modules.filter(filter);
  }
};
