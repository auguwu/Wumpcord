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
const Utilities = require('../util/Util');

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
     * If we have been ratelimited
     * @type {boolean}
     */
    this.ratelimited = false;

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
          'User-Agent': UserAgent
        }
      }
    });

    if (client) this.http.defaults.headers.Authorization = `Bot ${client.token}`;
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
        opts
      };

      this.cache.add(bucket);
      this.request(bucket)
        .then((data) => {
          this.cache.remove(bucket);
          return resolve(data);
        }).catch((error) => {
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

    return new Promise((resolve, reject) => {
      this.http.request({
        method: bucket.opts.method,
        url: bucket.opts.endpoint,
        data: bucket.opts.data,
        headers: Utilities.merge(bucket.headers, {
          'X-RateLimit-Precision': 'millisecond'
        })
      }).then(resp => {
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
          status: resp.status
        });

        return data.hasOwnProperty('message') ? reject(new DiscordAPIError(data.code, data.message)) : resolve(data);
      }).catch(error => reject(new DiscordRESTError(error.statusCode || 500, error.message)));
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
