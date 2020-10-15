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

const { HttpClient } = require('@augu/orchid');
const { Queue } = require('@augu/immutable');

const CacheTypes = [
  'guilds',
  'users',
  'all',
  'none'
];

const randomizedState = (len = 8) => {
  const characters = 'abcdefghijklmopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let text = '';

  // mutiple it by 2
  len *= 2;

  for (let i = 0; i < len; i++) {
    text += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return text;
};

/**
 * Represents a client for Discord's OAuth2 API, used for
 * web dashboards and such
 */
module.exports = class OAuth2Client {
  /**
   * Creates a new [OAuth2Client] instance
   * @param {OAuth2ClientOptions} opts The options to use
   */
  constructor(opts) {
    this.constructor._validate(opts);

    /**
     * The callback URL, if any (mostly used in the Express middleware)
     * @type {?string}
     */
    this.callbackUrl = opts.callbackUrl;

    /**
     * If we should add a `&state` query param in [OAuth2Client.authorizationURL]
     * @type {boolean}
     */
    this.useState = opts.useState || false;

    /**
     * The client's secret
     * @type {string}
     */
    this.secret = opts.clientSecret;

    /**
     * The scopes used
     * @type {string[]}
     */
    this.scopes = opts.scopes || [];

    /**
     * List of states a queue, if enabled
     * @type {?Queue<string>}
     */
    this.states = options.useState ? new Queue() : null;

    /**
     * The HTTP client used
     * @type {HttpClient}
     */
    this.http = new HttpClient();

    /**
     * The client's ID
     * @type {string}
     */
    this.id = opts.clientID;
  }

  /**
   * Statically checks if `opts` is valid or not
   * @param {OAuth2ClientOptions} opts The options used
   * @static
   */
  static _validate(opts) {
    if (typeof opts !== 'object') throw new TypeError(`Expecting \`object\`, but received ${typeof opts}`);
    if (!Object.keys(opts).length) throw new TypeError('Nothing was implemented?');

    if (
      !opts.clientID &&
      !opts.clientSecret &&
      !opts.cacheType
    ) throw new TypeError('Missing required keys: `clientID`, `clientSecret`, and `cacheType`');

    if (opts.callbackUrl && typeof opts.callbackUrl !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof opts.callbackUrl}`);
    if (!CacheTypes.includes(opts.cacheType)) throw new TypeError(`Invalid caching type "${opts.cacheType}" (${CacheTypes.join(', ')})`);
    if (opts.scopes) {
      if (!Array.isArray(opts.scopes)) throw new TypeError(`Expecting \`array\`, but gotten ${typeof opts.scopes}`);
      if (opts.scopes.some(uwu => typeof uwu !== 'string')) {
        const items = opts.scopes.filter(uwu => typeof uwu !== 'string');
        throw new TypeError(`${items.length} scopes weren't a string`);
      }
    }

    // todo: type the rest, cba rn it's like
    // 7pm / 19:00 and i dont feel like doing this lol
  }

  /**
   * Gets the authorization URL
   */
  get authorizationUrl() {
    const scopes = this.scopes.length ? `&scopes=${this.scopes.join('%20')}` : '';
    const { useState, current } = this.getState();
    const state = useState ? `&state=${current}` : '';
    const redirectUrl = this.redirectUrl ? `&redirect_url=${encodeURIComponent(this.redirectUrl)}` : '';

    return `https://discord.com/oauth2/authorize?client_id=${this.id}${state}${redirectUrl}${scopes}`;
  }

  /**
   * Returns the Express middleware of it
   * @type {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>}
   */
  get express() {
    return async (req, res, next) => {
      // soon
    };
  }

  /**
   * Gets the current state if it's enabled
   * @returns {StateInfo} Returns the information for the current state
   */
  getState() {
    if (!this.useState) return { useState: false, state: null };

    const state = randomizedState(16);
    this.states.addFirst(state);

    return {
      useState: true,
      state
    };
  }
};

/**
 * @typedef {object} OAuth2ClientOptions
 * @prop {boolean} [useState=false] If we should include a `&state` query param when authorizing
 * @prop {string} clientSecret The client's secret
 * @prop {string} [callbackUrl] The callback URL
 * @prop {'guilds' | 'users' | 'all' | 'none'} cacheType The caching type
 * @prop {string} clientID The client's ID
 * @prop {string[]} [scopes] The OAuth2 scopes to use
 *
 * @typedef {object} StateInfo
 * @prop {boolean} useState If [OAuth2ClientOptions.useState] is enabled
 * @prop {string} [state] The randomised state if it was enabled
 */
