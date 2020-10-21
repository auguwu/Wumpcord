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

const { getCron } = require('./util');
const Cron = getCron();

/**
 * Represents a [Job] class, which runs a specific script in a time-frame
 *
 * This uses the Cron Job ref, so refer to [here](https://crontab.guru/) for more information
 */
module.exports = class Job {
  /**
   * Creates a new [Job] instance
   * @param {string} name The name of the job
   * @param {string} interval The interval (refer to [here](https://crontab.guru/)) for more info
   */
  constructor(name, interval) {
    if (Cron === null) throw new TypeError('`node-cron` wasn\'t installed in this project.');
    if (!name || !interval) throw new TypeError('Missing `name` and `interval` in [Wumpcord.commands.Job]');
    if (typeof name !== 'string') throw new TypeError(`Expecting 'string' but gotten ${typeof name}`);
    if (typeof interval !== 'string') throw new TypeError(`Expecting 'string' but gotten ${typeof interval}`);
    if (!Cron.validate(interval)) {
      const error = new Error(`Invalid syntax in "${interval}"`);
      error.name = 'CronValidationError';
      error.syntax = interval;

      throw error;
    }

    /**
     * The interval to run
     * @type {string}
     */
    this.interval = interval;

    /**
     * The name of the job
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
   * Abstract function to run when this [Job] is called
   */
  async run() {
    throw new TypeError(`Missing "run" function in Job "${this.name}"`);
  }
};
