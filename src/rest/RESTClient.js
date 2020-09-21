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
          'Authorization': `Bot ${client.token}`,
          'User-Agent': UserAgent
        }
      }
    });
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
            reset: Number(Math.floor(resp.headers['x-ratelimit-reset']))
          });

          // todo: make this as a seperate class owo?
          const error = new Error(`Ratelimited on endpoint "${bucket.opts.method.toUpperCase()} ${bucket.opts.endpoint}"`);
          error.name = 'DiscordRatelimitError';
          error.retryAfter = Number(resp.headers['retry-after']);
          error.resetTime = Number(Math.floor(resp.headers['x-ratelimit-reset']));

          return reject(error);
        }

        if (data.hasOwnProperty('message')) return reject(new DiscordAPIError(data.code, data.message));
        return resolve(data);
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
 */
