/**
 * Copyright (c) 2020 August, Ice
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

import { HttpClient, HttpMethod } from '@augu/orchid';
import DiscordRestError from '../errors/DiscordRestError';
import DiscordAPIError from '../errors/DiscordAPIError';
import RatelimitBucket from './RatelimitBucket';
import * as Constants from '../Constants';
import { Queue } from '@augu/immutable';
import FormData from 'form-data';
import Util from '../util';

/**
 * Represents a dispatched request
 */
interface RequestDispatch<T = unknown> {
  /** Resolves the request */
  resolve(value: T | PromiseLike<T>): void;

  /** The error that was thrown */
  reject(error?: any): void;

  /** The headers to send out */
  headers: { [x: string]: any };

  /** The endpoint to make the request to */
  endpoint: string;

  /** The http method verb to use */
  method: HttpMethod;

  /** A file packet to send to Discord */
  file?: any[];

  /** Any data to send to Discord */
  data?: T;
}

/**
 * Represents a class to handle requests to Discord
 */
export default class RestClient {
  /** The last time the rest client has dispatched a request (when [RestClient.dispatch] was called) */
  public lastDispatchedAt: number = -1;

  /** If we are being ratelimited or not */
  public ratelimited: boolean = false;

  /** The last rest call from Discord (when we receive a payload from [RestClient._handleRequest]) */
  public lastCallAt: number = -1;

  /** List of requests to dispatch */
  private requests: Queue<RequestDispatch>;

  /** The client to use */
  private client: any;

  /** If we are locked from making anymore requests */
  public locked: boolean;

  /** The HTTP client to use */
  private http: HttpClient;

  /**
   * Represents a class to handle requests to Discord
   * @param client The client to use
   */
  constructor(client: any) {
    this.lastDispatchedAt = -1;
    this.ratelimited = false;
    this.lastCallAt = -1;
    this.requests = new Queue();
    this.client = client;
    this.locked = false;
    this.http = new HttpClient({
      defaults: {
        baseUrl: `${Constants.RestUrl}/v${Constants.RestVersion}`,
        headers: {
          Authorization: `Bot ${client.token}`,
          'User-Agent': Constants.UserAgent
        }
      }
    });
  }

  /**
   * Gets the current ping of the rest client
   */
  get ping() {
    return this.lastDispatchedAt === -1 ? -1 : (this.lastCallAt - this.lastDispatchedAt);
  }

  /**
   * If the rest client is busy or not
   */
  get busy() {
    return this.requests.size() !== 0;
  }

  /**
   * Dispatch a request to Discord
   * @param options The request options
   */
  dispatch<T = unknown>(options: Omit<RequestDispatch<T>, 'resolve' | 'reject'>) {
    return new Promise<T>((resolve, reject) => {
      const request: RequestDispatch = {
        resolve,
        reject,
        headers: Util.get(options, 'headers', {}),
        endpoint: options.endpoint,
        method: options.method,
        data: Util.get(options, 'data', undefined),
        file: Util.get(options, 'file', undefined)
      };

      this._executeRequest(request)
        .then((data: any) => {
          this.lastDispatchedAt = Date.now();
          return resolve(data);
        }).catch((error) => {
          this.lastDispatchedAt = Date.now();
          return reject(error);
        });
    });
  }

  /**
   * Executes the request and handles ratelimiting
   * @param request The dispatched requeest
   */
  async _executeRequest(request: RequestDispatch) {
    const bucket = new RatelimitBucket();
    let form: FormData | undefined = undefined;

    if (!['get', 'GET', 'head', 'HEAD'].includes(request.method) && !request.headers.hasOwnProperty('Content-Type'))
      request.headers!['Content-Type'] = 'application/json';

    if (request.file) {
      form = new FormData();
      for (let i = 0; i < request.file.length; i++) {
        const file = request.file[i];
        if (!file.name) file.name = 'file.png';

        form.append(file.name, file.file, { filename: file.name });
      }

      if (request.data) form.append('payload_json', JSON.stringify(request.data), { filename: 'payload_json' });
      request.headers['Content-Type'] = form.getHeaders();
    }

    return new Promise((resolve, reject) => this.http.request({
      method: request.method,
      url: request.endpoint,
      data: form ? form.getBuffer() : request.data, // form data overrides the data since it's already added it in the form
      headers: request.headers
    }).then(async res => {
      if (res.statusCode !== 204 && res.isEmpty) {
        this.client.debug('RestClient', 'Received a empty body from Discord, did we fuck up? (https://github.com/auguwu/Wumpcord/issues)');

        /**
         * Emitted when we receive a empty body payload
         * @fires restEmpty
         */
        this.client.emit('restEmpty');

        this.lastCallAt = Date.now();
        return resolve(null);
      }

      this.lastCallAt = Date.now();
      if (res.statusCode === 204) return resolve(null);

      const ratelimitInfo = await bucket.handle(request.endpoint, res);
      const data = res.json();

      if (ratelimitInfo.ratelimited) {
        this.ratelimited = true;
        await Util.sleep(Number(res.headers['retry-after']));

        return resolve(null);
      }

      // sometimes cloudflare can be mean >:(
      if (res.statusCode === 502) {
        /**
         * Fired when Discord or Cloudflare stop working
         * @fires restUnavailable
         */
        this.client.emit('restUnavailable');
        return reject(new DiscordAPIError(502, 'Gateway is unavailable at this time (https://discordstatus.com)'));
      }

      /**
       * Fired when the rest call has succeeded or errored out
       * @fires restCall
       * @param properties The properties available
       */
      this.client.emit('restCall', {
        ratelimitInfo,
        successful: res.successful,
        endpoint: request.endpoint,
        method: request.method,
        body: res.text(),
        ping: this.ping
      });

      if (data.hasOwnProperty('message'))
        return reject(new DiscordRestError(data.code, data.message));
      else
        return resolve(data);
    }).catch((ex) => reject(new DiscordAPIError(ex.statusCode || 500, ex.message))));
  }
}
