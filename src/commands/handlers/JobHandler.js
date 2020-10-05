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

const {
  posix: { join }
} = require('path');

const {
  fs: {
    readdir,
    lstat
  }
} = require('../util');

/** @type {typeof import('node-cron')} */
let cron = undefined;

try {
  cron = require('node-cron');
} catch(ex) {
  throw new SyntaxError('`node-cron` must be installed in this project');
}

/**
 * Represents the [JobHandler], to add & run jobs
 *
 * @extends {Collection<import('../Job')>}
 */
module.exports = class JobHandler extends Collection {
  /**
   * Creates a new [JobHandler] instance
   * @param {import('../CommandClient')} client The command client
   * @param {string | Array<import('../CommandClient').Class<import('../Job')>>} directory The directory or the jobs to load at runtime
   */
  constructor(client, directory) {
    super(Array.isArray(directory) ? directory.map(command => {
      const c = new command();
      c.init(client);

      return c;
    }) : undefined);

    /**
     * The directory or `null` if it's not a string
     * @type {?string}
     */
    this.directory = typeof directory === 'string'
      ? directory
      : null;

    /**
     * The command client
     * @private
     * @type {import('../CommandClient')}
     */
    this.client = client;

    // if they were dynamically loaded, let's add `bot` to it!
    this.map(i => i.init(client));
  }

  /**
   * Asynchronously loads the commands if it's in a directory
   */
  async load() {
    if (this.directory === undefined || this.directory === null) return;

    const stats = await lstat(this.directory);
    if (!stats.isDirectory()) {
      this.client.emit('error', new Error(`Directory "${this.directory}" was not a directory (https://docs.augu.dev/Wumpcord/errors#not-a-directory)`));
      return;
    }

    const files = await readdir(this.directory);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cls = require(join(this.directory, file));

      /** @type {import('../Job')} */
      const job = cls.default ? new cls.default() : new cls();
      job.init(this.client);

      this.set(job.name, job);
      this.client.emit('job.registered', job);

      cron.schedule(job.interval, job.run.bind(job));
    }

    this.client.emit('debug', `Loaded ${this.size} cron jobs!`);
  }
};
