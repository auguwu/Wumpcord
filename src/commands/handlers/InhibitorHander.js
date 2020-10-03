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

/**
 * Represents the [InhibitorHandler], to add & run inhibitors
 * 
 * @extends {Collection<import('../Inhibitor')>}
 */
module.exports = class InhibitorHandler extends Collection {
  /**
   * Creates a new [InhibitorHandler] instance
   * @param {import('../CommandClient')} client The command client
   * @param {string | Array<import('../CommandClient').Class<import('../Inhibitor')>>} directory The directory or the inhibitors to load at runtime
   */
  constructor(client, directory) {
    super(Array.isArray(directory) ? directory.map(inhibitor => new inhibitor()) : undefined);

    /**
     * The directory or `null` if it's not a string
     * @type {?string}
     */
    this.directory = typeof directory !== 'string' 
      ? directory 
      : null;

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
    if (this.directory === null) {
      this.client.emit('error', new Error('No `directory` was set, did you dynamically load commands? (https://docs.augu.dev/Wumpcord/errors#dynamic-commands)'));
      return;
    }

    const stats = await lstat(this.directory);
    if (!stats.isDirectory()) {
      this.client.emit('error', new Error(`Directory "${this.directory}" was not a directory (https://docs.augu.dev/Wumpcord/errors#not-a-directory)`));
      return;
    }

    const files = await readdir(this.directory);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cls = require(join(this.directory, file));
      
      /** @type {import('../Inhibitor')} */
      const inhibitor = cls.default ? new cls.default() : new cls();
      inhibitor.init(this.client);

      this.set(inhibitor.name, inhibitor);
      this.client.emit('inhibitor.registered', inhibitor);
    }

    this.client.emit('debug', `Loaded ${this.size} inhibitors!`);
  }
};
