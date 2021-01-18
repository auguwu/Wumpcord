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

import CommandClient from './CommandClient';

const getNodeCron = (): typeof import('node-cron') => {
  try {
    return require('node-cron');
  } catch {
    throw new TypeError('Missing `node-cron` package, please install it');
  }
};

/** Represents a interface for cron jobs if you are using decorators */
export interface CronJobExecutor {
  /**
   * Runs the cron job, this can be asynchronous or synchronous
   * and it'll be running in the background.
   */
  run(): void | Promise<void>;
}

/**
 * Represents a cron scheduler to do schedulers on every time of the day the bot is running.
 *
 * This utility class uses the UNIX cron job syntax, learn more [here](https://crontab.guru/).
 *
 * ## Syntax Tree
 * ```py
 * # ┌────────────── second (optional)
 * # │ ┌──────────── minute
 * # │ │ ┌────────── hour
 * # │ │ │ ┌──────── day of month
 * # │ │ │ │ ┌────── month
 * # │ │ │ │ │ ┌──── day of week
 * # │ │ │ │ │ │
 * # │ │ │ │ │ │
 * # * * * * * *
 * ```
 */
export default abstract class CronJob {
  public ['constructor']!: typeof CronJob;

  /** The expression of the job, used for validation and queueing */
  public expression: string;

  /** The name of the job, for easy fuzzy searching & disposing */
  public name: string;

  /** The bot instance */
  public bot!: CommandClient;

  /**
   * Constructs a new [CronJob] instance
   * @param name The name of the job
   * @param expression The expression to use
   */
  constructor(name: string, expression: string) {
    const cron = getNodeCron();
    if (!cron.validate(expression)) throw new TypeError(`Expression \`${expression}\` was invalid.`);

    this.expression = expression;
    this.name = name;
  }

  /**
   * Initialize this [CronJob] to have a `bot` property
   * @param bot The bot instance
   */
  init(bot: CommandClient) {
    this.bot = bot;
    return this;
  }

  /**
   * Runs the cron job, this can be asynchronous or synchronous
   * and it'll be running in the background.
   */
  abstract run(): void | Promise<void>;
}
