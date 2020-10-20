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

const { RestVersion, UserAgent } = require('../Constants');
const DiscordRatelimitError = require('./DiscordRatelimitedError');
const DiscordRESTError = require('./DiscordRestError');
const DiscordAPIError = require('./DiscordAPIError');
const { HttpClient } = require('@augu/orchid');
const { Queue } = require('@augu/immutable');
const Util = require('../util/Util');

/**
 * Represents a client for executing calls to Discord's REST API
 */
module.exports = class RESTClient {
  /**
   * Creates a new [RESTClient] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   */
  constructor(client) {
    /**
     * The last dispatched called
     * @type {number}
     */
    this.lastDispatched = NaN;

    /**
     * If we have been ratelimited
     * @type {boolean}
     */
    this.ratelimited = false;

    /**
     * The last rest call send
     * @type {number}
     */
    this.lastCall = NaN;

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The cache of the requests
     * @type {Queue<RatelimitBucket>}
     */
    this.cache = new Queue();

    /**
     * HTTP client itself
     * @type {HttpClient}
     */
    this.http = new HttpClient({
      defaults: {
        baseUrl: `https://discord.com/api/v${RestVersion}`,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': UserAgent
        }
      }
    });

    if (client) this.http.defaults.headers.Authorization = `Bot ${client.token}`;
  }

  /**
   * Returns the ping of the [RESTClient]
   */
  get ping() {
    return Number.isNaN(this.lastCall) ? NaN : (this.lastCall - this.lastDispatched);
  }

  /**
   * Dispatches a new request
   * @param {DispatchOptions} opts The options to use
   * @returns {Promise<any>} Promise to resolve data from Discord
   */
  dispatch(opts) {
    return new Promise((resolve, reject) => {
      /** @type {RatelimitBucket} */
      const bucket = {
        resolve,
        reject,
        opts: {
          endpoint: opts.endpoint,
          headers: Util.get('headers', {}, opts),
          method: opts.method || 'GET',
          data: Util.get('data', undefined, opts)
        }
      };

      this.cache.add(bucket);
      this.request(bucket)
        .then((data) => {
          this.lastDispatched = new Date().getTime();
          this.cache.remove(bucket);

          return resolve(data);
        }).catch((error) => {
          this.lastDispatched = new Date().getTime();
          this.cache.remove(bucket);

          return reject(error);
        });
    });
  }

  /**
   * Executes the request
   * @param {RatelimitBucket} bucket The bucket to use
   */
  request(bucket) {
    if (this.ratelimited) throw new Error('Currently ratelimited, paused execution');

    if (!['get', 'head'].includes(bucket.opts.method.toLowerCase())) {
      bucket.opts.headers['Content-Type'] = 'application/json';
    }

    return new Promise((resolve, reject) => {
      this.http.request({
        method: bucket.opts.method,
        url: bucket.opts.endpoint,
        data: bucket.opts.data,
        headers: bucket.opts.headers
      }).then(resp => {
        // 204 = no content, so let's add a check!
        if (resp.statusCode !== 204 && resp.isEmpty) {
          this.client.emit('debug', 'Missing payload from Discord, did we fuck up? (https://github.com/auguwu/Wumpcord/issues)');

          /**
           * Fired when we received an empty body
           * @fires restEmpty
           */
          this.client.emit('restBodyEmpty');

          this.lastCall = new Date().getTime();
          return resolve(null);
        }

        this.lastCall = new Date().getTime();
        if (resp.statusCode === 204) return resolve();

        const data = resp.json();
        if (resp.statusCode === 429) {
          /**
           * Emitted when the REST client has reached a ratelimited state
           * @fires restRatelimit
           */
          this.client.emit('restRatelimit', {
            retryAfter: Number(resp.headers['retry-after']),
            endpoint: bucket.opts.endpoint,
            global: Boolean(resp.headers['x-ratelimit-global']),
            method: bucket.opts.method,
            reset: Number(Math.floor(resp.headers['x-ratelimit-reset']))
          });

          const error = new DiscordRatelimitError({
            retryAfter: Number(resp.headers['retry-after']),
            resetTime: Number(Math.floor(resp.headers['x-ratelimit-reset'])),
            endpoint: bucket.opts.endpoint,
            global: Boolean(resp.headers['x-ratelimit-global']),
            method: bucket.opts.method
          });

          // Clear it if we already have one running
          if (this._ratelimitTimeout) clearTimeout(this._ratelimitTimeout);

          this.ratelimited = true;
          this._ratelimitTimeout = setTimeout(() => {
            this.ratelimited = false;

            /**
             * Emitted when we are now un-ratelimited
             * @fires restUnratelimit
             */
            this.client.emit('restUnratelimit');
          }, Date.now() - (Number(resp.headers['retry-after'])));

          return reject(error);
        }

        // Check for 502 errors because Cloudflare is amazing!
        if (resp.statusCode === 502) {
          this.client.emit('debug', '[RestClient] Received a 502, thanks CloudFlare!');
          setTimeout(() => {
            this.client.emit('debug', '[RestClient] Attempting to make a request again...');
            this.request(bucket);
          }, Math.floor(Math.random() * 1900 + 100)); // timeout number is from abal <3

          return;
        }

        /**
         * Fired when we made a request successfully or not
         * @fires restCall
         * @param {RestCallProperties} props The properties
         */
        this.client.emit('restCall', {
          successful: resp.successful,
          endpoint: bucket.opts.endpoint,
          method: bucket.opts.method,
          status: resp.status,
          body: resp.text(),
          ping: this.ping
        });

        return data.hasOwnProperty('message') ? reject(new DiscordAPIError(data.code, data.message)) : resolve(data);
      }).catch(error => {
        const restError = new DiscordRESTError(error.statusCode || 500, error.message);

        /**
         * Fired when the REST client has failed to meet expectations
         * @fires restError
         */
        this.client.emit('restError', restError);
        return reject(restError);
      });
    });
  }
};

/**
 * @typedef {object} RatelimitBucket
 * @prop {(value?: any | PromiseLike<any>) => void} resolve The callback function
 * @prop {(error: DiscordRESTError) => void} reject Called when the HTTP client couldn't sustain a request
 * @prop {DispatchOptions} opts The dispatched options
 *
 * @typedef {object} DispatchOptions
 * @prop {string} endpoint The endpoint
 * @prop {import('@augu/orchid').HttpMethod} method The http method to use
 * @prop {any} [data] The data to use
 * @prop {{ [x: string]: any }} [headers] The headers to append
 *
 * @typedef {object} RestCallProperties
 * @prop {string} endpoint The endpoint
 * @prop {import('@augu/orchid').HttpMethod} method The method used
 * @prop {string} status The status (i.e: `200 OK`)
 * @prop {boolean} successful If we did it successfully
 */
