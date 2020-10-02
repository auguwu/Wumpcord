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

const ArugmentTypeReaderHandler = require('./handlers/ArgumentTypeReaderHandler');
const InhibitorHandler = require('./handlers/InhibitorHander');
const WebSocketClient = require('../gateway/WebSocketClient');
const CommandHandler = require('./handlers/CommandHandler');
const JobHandler = require('./handlers/JobHandler');
const wumpcord = require('..');
const { User } = require('../entities');

/**
 * Represents the entrypoint class of the commands API
 */
module.exports = class CommandClient extends WebSocketClient {
  /**
   * Creates a new [CommandClient] instance
   * @param {import('../gateway/WebSocketClient').ClientOptions & CommandClientOptions} options The options to use
   */
  constructor(options) {
    super(options);

    /**
     * The type readers for all arguments
     * @type {import('./handlers/ArgumentTypeReaderHandler')}
     */
    this.types = new ArgumentTypeReaderHandler(this);

    /**
     * The inhibitor handler
     * @type {import('./handlers/InhibitorHandler') | null}
     */
    this.inhibitors = options.inhibitors !== undefined
      ? new InhibitorHandler(this, options.inhibitors)
      : null;

    /**
     * The commands handler
     * @type {import('./handlers/CommandHandler')}
     */
    this.commands = new CommandHandler(this, options.commands);

    /**
     * List of prefixes to use
     * @type {string[]}
     */
    this.prefixes = options.prefixes || ['@mention@'];

    /**
     * The jobs handler
     * @type {import('./handlers/JobHandler') | null}
     */
    this.jobs = options.jobs !== undefined
      ? new JobHandler(this, options.jobs)
      : null;

    this.once('ready', () => {
      this.prefixes = this.prefixes.map((prefix, index) => {
        if (prefix === '@mention@') {
          this.prefixes.splice(index, 1);
          this.prefixes.push(`<@${this.user.id}> `, `<@!${this.user.id}> `);

          return `<@${this.user.id}>`;
        } else {
          return prefix;
        }
      });
    });

    const canEdit = options.editedMessage !== undefined ? !!options.editedMessage : false;
    if (canEdit) this.on('messageUpdate', (old, msg) => this.commands.handleEditedMessage(old, msg));

    this.on('message', msg => this.commands.handleMessage(msg));
  }

  /**
   * Loads the bot, this function must be called to run it!
   */
  async load() {
    this.emit('debug', [
      '-=- Debug Information -=-',
      `Wumpcord Version: ${wumpcord.version}`,
      `Gateway Version : ${wumpcord.Constants.GatewayVersion}`,
      `Rest Version    : ${wumpcord.Constants.RestVersion}`,
      '-=- Debug Information -=-'
    ].join('\n'));

    await this.commands.load();

    if (this.inhibitors) await this.inhibitors.load();
    if (this.jobs) await this.jobs.load();

    this.emit('debug', 'Connecting to Discord...');
    await super.connect()
      .then(() => {
        this.emit('debug', 'Now initialising a new connection...');
        if (this.options.loadingPresence) this.setStatus('idle', {
          name: this.options.loadingPresence
        });
      }).catch(error => {
        this.emit('error', error);
        setTimeout(() => this.dispose(), 5000);
      });
  }

  /**
   * Gets the default prefix
   */
  getDefaultPrefix() {
    return this.prefixes[0];
  }

  /**
   * Checks if the user is an owner
   * @param {string | import('../entities/User')} userID The user instance or the user's ID
   */
  isOwner(userID) {
    if (userID instanceof User) userID = userID.id;

    return this.owners.includes(userID);
  }
};

// we splitted it so [CommandClientOptions] won't include a type
// parameter (@template in JSDoc and in VSCode represents a type param of a type)
/**
 * @template T The class instance
 * @typedef {{ new(...args: any[]): T; }} Class Represents a class that can be initialised with the `new` keyword
 */

/**
 * @typedef {object} CommandClientOptions
 * @prop {string} [loadingPresence] The presence to load when booting up
 * @prop {boolean} [editedMessage] If we should enable edited messages (if the user has edited a message, it'll update the commands API)
 * @prop {string[]} [owners=[]] List of owners of the bot
 * @prop {string[]} prefixes A list of prefixes (first one is considered the "default", you can add `@mention@` to add mentions)
 * @prop {string | Class<import('./Inhibitor')>} [inhibitors] List of inhibitors to run at runtime,
 * or a directory to automatically load them in when [CommandClient.load/0] starts, or `undefined`
 * if you don't wanna enable them and loads the defaults
 * 
 * @prop {string | Class<import('./Command')>} commands List of commands to load at runtime
 * or the directory to automatically load them in when [CommandClient.load/0] starts at
 * 
 * @prop {string | Class<import('./Job')>} [jobs] List of jobs to load at runtime
 * or a directory to automatically load them in when [CommandClient.load/0] starts, or `undefined`
 * if you don't wanna enable the [Wumpcord.commands.handlers.JobHandler (job handler)].
 */
