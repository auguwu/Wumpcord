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

class CooldownToken {
  /**
   * Creates a new [CooldownToken] instance
   * @param {CooldownTokenOptions} options The options
   */
  constructor(options) {
    /**
     * If we have successfully throttled the request
     * @type {boolean}
     */
    this.throttled = options.throttled;

    /**
     * How time we have left
     * @type {number}
     */
    this.timeLeft = options.timeLeft;
  }
}

/**
 * Represents a bucket to handle all cooldowns
 * @extends {Collection<Collection<CooldownToken>>}
 */
module.exports = class CooldownBucket extends Collection {
  /**
   * Creates a new [CooldownBucket] instance
   */
  constructor() {
    super();

    /**
     * List of timeouts available to this [CooldownBucket] instance
     * @type {Collection<NodeJS.Timeout>}
     */
    this.timeouts = new Collection();
  }

  /**
   * Checks if the user is on cooldown or not
   * @param {import('../Command')} command The command
   * @param {import('../CommandContext')} ctx The command's context
   * @returns {CooldownToken} Returns the token of the cooldown
   */
  check(command, ctx) {
    const ratelimits = this.emplace(command.name, new Collection());
    const throttle = command.cooldown * 1000;
    const now = Date.now();

    if (!ratelimits.has(ctx.author.id)) {
      ratelimits.set(ctx.author.id);
      const timeout = setTimeout(() => {
        this.timeouts.delete(`timeout:${ctx.author.id}`);
        ratelimits.delete(ctx.author.id);
      }, throttle);

      timeout.unref();
      this.timeouts.set(`timeout:${ctx.author.id}`, timeout);

      const token = new CooldownToken({ throttled: false, timeLeft: Math.floor(throttle / 1000) });
      ratelimits.set(ctx.author.id, token);

      return token;
    } else {
      let token;
      const time = ratelimits.get(ctx.author.id);
      if (now < time) {
        token = new CooldownToken({ throttled: true, timeLeft: (time - now) / 1000 });
        return token;
      }

      ratelimits.set(ctx.author.id, now);
      const timeout = setTimeout(() => {
        this.timeouts.delete(`timeout:${ctx.author.id}`);
        ratelimits.delete(ctx.author.id);
      }, throttle);

      timeout.unref();
      this.timeouts.set(`timeout:${ctx.author.id}`, timeout);
      ratelimits.set(ctx.author.id, now);
    }
  }
};

/**
 * @typedef {object} CooldownTokenOptions
 * @prop {boolean} throttled If we are on cooldown or not
 * @prop {number} timeLeft How much time the user has in seconds
 */
