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

import type { Command, CommandClient } from '..';
import type { MessageUpdateEvent } from '../../events';
import type { Message } from '../../models';
// import { getCommandDefinitions } from '../decorators/Command';
import { promises as fs } from 'fs';
import { Collection } from '@augu/collections';
import { join } from 'path';

interface ConstructableClass<T> extends Ctor<T> {
  /**
   * The default export if using ESM / TypeScript
   */
  default?: Ctor<T>;
}

interface Ctor<T> {
  /**
   * Create a new instance of [T]
   */
  new (...args: any[]): T;
}

interface Module {
  commands: Collection<string, Command>;
  name: string;
}

export default class CommandHandler {
  public directory: string;
  public commands: Collection<string, Command>;
  public modules: Collection<string, Module>;

  #client: CommandClient;

  constructor(client: CommandClient, directory: string) {
    this.directory = directory;
    this.commands = new Collection();
    this.modules = new Collection();
    this.#client = client;
  }

  private debug(message: string) {
    this.#client.client.debug('CommandHandler', message);
  }

  async run() {
    this.debug('Initializing command handler...');

    // Get the statistics of the "directory" specified
    // This doesn't de-reference symbolic links
    const stats = await fs.lstat(this.directory);

    // If it's not a directory, just reject running
    if (!stats.isDirectory()) {
      this.debug(`Directory '${this.directory}' was not a directory`);
      return;
    }

    // Get the "modules" of the directory
    const modules = await fs.readdir(this.directory);
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const stats = await fs.lstat(join(this.directory, mod));

      if (!stats.isDirectory()) {
        this.debug(`Module path '${join(this.directory, mod)}' was not a directory, skipping`);
        continue;
      }

      const files = await fs.readdir(join(this.directory, mod));
      const module = this.modules.emplace(mod, {
        commands: new Collection(),
        name: mod
      });

      for (let j = 0; j < files.length; j++) {
        const path = join(this.directory, mod, files[j]);
        const ctor: ConstructableClass<Command> = await import(join(this.directory, mod, files[j]));
        let command = ctor.default ? new ctor.default().init(this.#client, mod, path) : new ctor().init(this.#client, mod, path);

        // Get a list of subcommands from the decorator

        // add them to cache
        module.commands.set(command.name, command);
        this.commands.set(command.name, command);
        this.debug(`Loaded command '${command.name}'`);

        // emit that we registered a command
        this.#client.emit('registered', command);
      }

      // update modules list
      this.modules.set(mod, module);
    }
  }

  handleMessageEdit(event: MessageUpdateEvent) {
    // Ignore if there is no old message cached
    if (event.old === null) return;

    // Ignore if `message` doesn't have a message content
    if (!event.message.content) return;

    // Check if the old message content is the same
    if (event.old.content === event.message.content) return;

    // Handle the command
    return this.handle(event.message as Message);
  }

  handle(message: Message) {
    // Ignore bots
    if (message.author.bot) return;
  }
}
