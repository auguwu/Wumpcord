/**
 * Copyright (c) 2020-2021 August, Ice
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

import { ArgumentTypeReader, ArgumentUnionTypeReader } from './arguments';
import WebSocketClient, { WebSocketClientEvents } from '../gateway/WebSocketClient';
import type CommandMessage from './CommandMessage';
import type * as types from '../types';
import { Collection } from '@augu/collections';
import EventBus from '../util/EventBus';
import Command from './Command';
import CronJob from './CronJob';
import Util from '../util';
import CommandHandler from './handlers/CommandHandler';

interface CommandClientEvents extends WebSocketClientEvents {
  /**
   * Emitted when a command has been unregistered
   * @param command The command that was unregistered
   */
  unregistered(command: Command): void;

  /**
   * Emitted when a command has been successfully registered
   * @param command The command that was registered
   */
  registered(command: Command): void;

  /**
   * Emitted when a command has errored out
   * @param message The command message
   * @param command The command that failed
   * @param error The exception that occured
   */
  exception(message: CommandMessage, command: Command, error: Error): void;

  /**
   * Emitted when a command has been ran successfully
   * @param command The command that was ran
   */
  ran(command: Command): void;
}

interface CommandClientOptions {
  /**
   * If we should tell the end user that the command wasn't found, default is false
   */
  unknownCommandResponses?: boolean;

  /**
   * The options for creating a [WebSocketClient]
   */
  clientOptions?: Omit<types.NullableClientOptions, 'token'>;

  /**
   * If argument prompts should be interactive or not,
   * instead of validating all arguments, it'll show a prompt
   * of what the argument should be.
   */
  interactive?: boolean;

  /**
   * A list of prefixes the bot should listen for, you can use
   * `@mention@` to automatically look for a mention prefix.
   *
   * The first prefix will be the default prefix when calling
   * `Command.usage`
   */
  prefixes: string | string[];

  /**
   * Absolute path to load commands in
   */
  commandsDir: string;

  /**
   * Absolute path to load custom type readers in
   */
  readersDir?: string;

  /**
   * Absolute path to load events in
   */
  eventsDir: string;

  /**
   * Absoulte path to load cron jobs in
   */
  jobsDir?: string;

  /**
   * An array of user IDs or the owner's ID of who owns the bot
   */
  owners: string | string[];
}

export default class CommandClient extends EventBus<CommandClientEvents> {
  public typeReaders: Collection<string, ArgumentTypeReader<any>>;
  public options: CommandClientOptions;
  public handler: CommandHandler;
  public client: WebSocketClient;
  public jobs: Collection<string, CronJob>;

  constructor(token: string, options: CommandClientOptions) {
    super();

    this.typeReaders = new Collection();
    this.handler = new CommandHandler(this, options.commandsDir!);
    this.options = Util.merge(options, {
      unknownCommandResponses: false,
      clientOptions: {},
      interactive: true,
      prefixes: [],
      commandsDir: '',
      readersDir: '',
      eventsDir: '',
      jobsDir: '',
      owners: []
    });

    this.client = new WebSocketClient({ token, ...this.options.clientOptions });
    this.jobs = new Collection();
  }

  private debug(message: string, tag: string = '') {
    this.client.debug(`CommandClient${tag}`, message);
  }

  get defaultPrefix() {
    return typeof this.options.prefixes === 'string' ? this.options.prefixes : this.options.prefixes[0];
  }

  async start() {
    this.debug('Loading all commands, type-readers, events, and jobs...');

    this.debug('Loaded everything, connecting to Discord...');
    return this.client.connect();
  }

  disconnect(reconnect: boolean = false) {
    this.handler.commands.clear();
    this.handler.modules.clear();
    this.jobs.clear();

    return this.client.disconnect(reconnect);
  }

  resolveArgumentType(type: string) {
    if (!type.includes('|')) return this.typeReaders.get(type);

    let reader = this.typeReaders.get(type);
    if (reader !== undefined) return reader;

    const union = new ArgumentUnionTypeReader(this, type);
    this.typeReaders.emplace(type, union);

    return union;
  }
}
