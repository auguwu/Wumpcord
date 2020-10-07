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

/**
 * Represents an error when the user has been ratelimited by Discord
 */
module.exports = class DiscordRatelimitedError extends Error {
  /**
   * Creates a new [DiscordRatelimitedError] instance
   * @param {RatelimitErrorObject} obj The object that contains errors
   */
  constructor(obj) {
    super(`Ratelimited on "${obj.method.toUpperCase()} ${obj.endpoint}"`);

    /**
     * Retry after x amount of milliseconds
     * @type {number}
     */
    this.retryAfter = obj.retryAfter;

    /**
     * Date object when the global bucket resets from Discord
     * @type {Date}
     */
    this.resetTime = new Date(obj.resetTime);

    /**
     * The endpoint
     * @type {string}
     */
    this.endpoint = obj.endpoint;

    /**
     * The method used
     * @type {import('@augu/orchid').HttpMethod}
     */
    this.method = obj.method;

    /**
     * If it was a global ratelimit or not
     * @type {boolean}
     */
    this.global = obj.global;

    this.name = 'DiscordRatelimitedError';
  }
};

/**
 * @typedef {object} RatelimitErrorObject
 * @prop {number} retryAfter The retry after mark
 * @prop {number} resetTime The number of milliseconds the bucket will reset
 * @prop {string} endpoint The endpoint the user was ratelimited on
 * @prop {boolean} global If it was a global ratelimit or not
 * @prop {import('@augu/orchid').HttpMethod} method The method used
 */
