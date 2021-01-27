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

import type { CommandClient, DiscordEvent } from '..';
import { isListener, getEventDefinitions } from '../decorators/Listener';
import { promises as fs } from 'fs';
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

export default class EventHandler {
  public directory: string;
  #client: CommandClient;

  constructor(client: CommandClient, directory: string) {
    this.directory = directory;
    this.#client = client;
  }

  private debug(message: string) {
    this.#client.client.debug('EventHandler', message);
  }

  async run() {
    this.debug('Initializing event handler...');

    // Get the statistics of the "directory" specified
    // This doesn't de-reference symbolic links
    const stats = await fs.lstat(this.directory);

    // If it's not a directory, just reject running
    if (!stats.isDirectory()) {
      this.debug(`Directory '${this.directory}' was not a directory`);
      return;
    }

    // Get the files of the directory
    const files = await fs.readdir(this.directory);
    for (let i = 0; i < files.length; i++) {
      const path = join(this.directory, files[i]);
      const ctor: ConstructableClass<DiscordEvent> = await import(path);
      const event = ctor.default ? new ctor.default().init(this.#client) : new ctor().init(this.#client);

      if (isListener(event)) {
        const definitions = getEventDefinitions(event);
        for (let j = 0; j < definitions.length; j++) {
          const ev = definitions[j];
          this.#client.client.on(ev.event, (...args: any[]) => {
            try {
              // @ts-ignore they are the same, why is `any[]` being checked?
              ev.run(...args);
            } catch(ex) {
              this.debug(`Exception has occured in event '${ev.event}'\n${ex}`);
              this.#client.client.emit('error', ex);
            }
          });
        }

        continue;
      }

      this.#client.client.on(event.event, async (...args: any[]) => {
        try {
          // @ts-ignore they are the same, why is `any[]` being checked?
          await Promise.resolve(event.run(...args));
        } catch(ex) {
          this.debug(`Exception has occured in event '${event.event}'\n${ex}`);
          this.#client.client.emit('error', ex);
        }
      });
    }
  }
}
