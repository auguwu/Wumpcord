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

import { USER_AGENT, RestVersion } from '../util/Constants';
import { HttpClient, HttpMethod } from '@augu/orchid';
import { DiscordRestError } from '../errors/DiscordRestError';
import { Queue } from '@augu/immutable';

interface RatelimitBucket<T> {
  callback(value?: T | PromiseLike<T>): void;
  dispatch: DispatchOptions<T>;
}

interface DispatchOptions<T> {
  endpoint: string;
  method: HttpMethod;
  data?: T;
}

export class RESTClient {
  /** List of ratelimits to handle */
  private queue: Queue<RatelimitBucket<unknown>> = new Queue();

  /** The bot's token */
  private token: string;

  /** The Orchid instance */
  private http: HttpClient;

  /** If the Rest client is busy executing requests */
  public busy: boolean;

  /**
   * Creates a new RestClient
   * @param token The token itself
   */
  constructor(token: string) {
    this.token = token;
    this.http = new HttpClient({ baseUrl: `https://discord.com/api/v${RestVersion}` });
    this.busy = false;
  }

  /**
   * Create a new HTTP request
   */
  dispatch<T>(opts: DispatchOptions<T>) {
    return new Promise<T>((resolve) => {
      const bucket: RatelimitBucket<T> = { callback: resolve, dispatch: opts };

      this.queue.add(bucket);
      this.handle();
    });
  }

  private handle() {
    if (this.busy || this.queue.empty) return;

    this
      ._request(this.queue.shift()!)
      .then(() => {
        this.busy = false;
        this.handle();
      });
  }

  private _request(bucket: RatelimitBucket<any>) {
    return new Promise<void>((resolve, reject) => {
      this
        .http
        .request({
          method: bucket.dispatch.method,
          headers: {
            'Authorization': `Bot ${this.token}`,
            'User-Agent': USER_AGENT
          },
          data: bucket.dispatch.data,
          url: bucket.dispatch.endpoint
        }).then((res) => {
          const data = res.json();
          if (res.headers['x-ratelimit-remaining'] === '0') {
            this.queue.addFirst(bucket);
            setTimeout(resolve, Number(res.headers['x-ratelimit-reset-after']) * 1000);
            return;
          }

          bucket.callback(data);
        }).catch(error => reject(new DiscordRestError({
          statusCode: error.statusCode,
          message: `Unexpected ${error.statusCode}: ${error.message}`,
          method: bucket.dispatch.method,
          route: bucket.dispatch.endpoint
        })));
    });
  }
}