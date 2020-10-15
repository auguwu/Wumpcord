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

const { HttpClient, middleware } = require('@augu/orchid');
const { Queue, Collection } = require('@augu/immutable');
const { RestVersion } = require('../Constants');
const EventBus = require('../util/EventBus');

const CacheTypes = [
  'guilds',
  'users',
  'all',
  'none'
];

/** @type {() => typeof import('form-data')} */
const getFormData = (() => {
  try {
    const forms = require('form-data');
    return forms;
  } catch(ex) {
    return null;
  }
});

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
module.exports = class OAuth2Client extends EventBus {
  /**
   * Creates a new [OAuth2Client] instance
   * @param {OAuth2ClientOptions} opts The options to use
   */
  constructor(opts) {
    super();

    this.constructor._validate(opts);

    /**
     * The redirect URL, if any (mostly used in the Express middleware)
     * @type {string}
     */
    this.redirectUrl = opts.redirectUrl;

    /**
     * The callback URL, if any (mostly used in the Express middleware)
     * @type {?string}
     */
    this.callbackUrl = opts.callbackUrl;

    /**
     * Lifecycle hook when the library has failed to meet expectations (mostly used in the Express middleware)
     * @type {?(req: import('express').Request, res: import('express').Response, error: Error) => void}
     */
    this.onError = opts.onError;

    /**
     * Lifecycle hook when we successfully gotten an access token
     * @type {(req: import('express').Request, res: import('express').Response, accessToken: AccessTokenInfo) => void}
     */
    this.onSuccess = opts.onSuccess;

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
    this.states = opts.useState ? new Queue() : null;

    /**
     * The HTTP client used
     * @type {HttpClient}
     */
    this.http = new HttpClient({
      defaults: {
        baseUrl: `https://discord.com/api/v${RestVersion}`
      }
    });

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

    // update: i still don't feel like updating
    // this so uh if it breaks its ur fault lol
  }

  /**
   * Gets the authorization URL
   */
  get authorizationUrl() {
    const scopes = this.scopes.length ? `&scope=${this.scopes.join('%20')}` : '';
    const { useState, state } = this.getState();
    const stateQ = useState ? `&state=${state}` : '';
    const redirectUrl = this.callbackUrl ? `&redirect_url=${encodeURIComponent(this.redirectUrl)}` : '';

    return `https://discord.com/oauth2/authorize?client_id=${this.id}&response_type=code${stateQ}${redirectUrl}${scopes}`;
  }

  /**
   * Returns the Express middleware of it
   * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>}
   */
  get express() {
    return async (req, res, next) => {
      if (req.url.includes(this.callbackUrl)) await this.authorize(req, res, next);
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

  /**
   * Gets an access token from Discord
   * @param {string} code The code
   * @param {string} redirectUri The custom redirect URL
   * @returns {Promise<AccessTokenInfo>} Returns the access token information
   */
  async getAccessToken(code, redirectUri) {
    const FormData = getFormData();
    if (FormData === null) throw new TypeError('Missing `form-data` package to encode, please install it.');

    this.http.use(middleware.forms());

    const data = new FormData();
    data.append('client_id', this.id);
    data.append('client_secret', this.secret);
    data.append('grant_type', 'authorization_code');
    data.append('code', code);
    data.append('redirect_uri', redirectUri);
    data.append('scope', this.scopes.join(' '));

    const res = await this
      .http
      .get('/oauth2/token')
      .body(data);

    const body = res.json();
    return {
      refreshToken: body.refresh_token,
      accessToken: body.access_token,
      expiresIn: Date.now() + (body.expires_in * 1000)
    };
  }

  /**
   * Refreshes the access token for a new one
   * @param {string} refreshToken The token you used in [OAuth2Client.getAccessToken]
   * @param {string} redirectUri The redirect URL
   * @returns {Promise<AccessTokenInfo>} Returns a fresh, new access token information
   */
  async refreshToken(refreshToken, redirectUri) {
    const FormData = getFormData();
    if (FormData === null) throw new TypeError('Missing `form-data` package to encode, please install it.');

    this.http.use(middleware.forms());

    const data = new FormData();
    data.append('client_id', this.id);
    data.append('client_secret', this.secret);
    data.append('grant_type', 'refresh_token');
    data.append('refresh_token', refreshToken);
    data.append('redirect_uri', redirectUri);
    data.append('scope', this.scopes.join(' '));

    const res = await this
      .http
      .get('/oauth2/token')
      .body(data);

    const body = res.json();
    return {
      refreshToken: body.refresh_token,
      accessToken: body.access_token,
      expiresIn: Date.now() + (body.expires_in * 1000)
    };
  }

  /**
   * Authorizes a user and redirects them to a URL
   * @param {import('express').Request} req The request
   * @param {import('express').Response} res The response
   * @param {import('express').NextFunction} next The next function
   */
  async authorize(req, res, next) {
    if (!req.query.code) {
      this.emit('error', new Error('Missing `?code` query parameter'));
      if (this.onError) this.onError(req, res, new Error('Missing `?code` query parameter'));

      return next();
    }

    if (this.useState && !req.query.state) {
      this.emit('error', new Error('Missing `?state` query parameter'));

      if (this.onError) this.onError(req, res, new Error('Missing `?state` query parameter'));
      return next();
    }

    if (this.useState) {
      const current = req.query.state;
      const found = this.states.find(code => code === current);

      if (!found) {
        this.emit('error', new Error(`Invalid state "${current}", invalidating session`));

        if (this.onError) this.onError(req, res, new Error(`Invalid state "${current}", invalidating session`));
        return next();
      }
    }

    // now we do access token stuff here
    const accessTokenInfo = await this.getAccessToken(req.query.code, this.redirectUrl);

    this.emit('debug', 'Received access token, now running `onSuccess` lifecycle hook...');
    this.onSuccess(req, res, accessTokenInfo);
    res.redirect(this.redirectUrl);

    return next();
  }
};

/**
 * @typedef {object} OAuth2ClientOptions
 * @prop {(req: import('express').Request, res: import('express').Response, accessToken: AccessTokenInfo) => void} [onSuccess] Lifecycle hook when we successfully gotten an access token
 * @prop {(req: import('express').Request, res: import('express').Response, error: Error) => void} [onError] Lifecycle hook when the library has failed to meet expectations
 * @prop {string} [redirectUrl] The redirect URL when we successfully gotten an access token
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
 *
 * @typedef {object} AccessTokenInfo
 * @prop {string} refreshToken
 * @prop {string} accessToken
 * @prop {number} expiresIn
 */
