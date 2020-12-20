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

import type { HttpResponse, HttpRequest } from '@augu/orchid';
import Util from '../util';

interface RatelimitInfo {
  ratelimited: boolean;
  remaining: number;
  resetTime: number;
}

const getAPIOffset = (date: string) => new Date(date).getTime() - Date.now();
const calculate = (reset: number, serverDate: string) => new Date(reset * 1000).getTime() - getAPIOffset(serverDate);

/**
 * Represents a bucket for handling ratelimiting with Discord
 */
export default class RatelimitBucket {
  private _globalTimer!: Promise<unknown> | undefined;

  /** The remaining requests we can do before locking the rest client */
  private remaining: number = 0;

  /** The reset timestamp */
  private resetTime: number = 0;

  /**
   * Handles ratelimiting
   * @param res The response from the http request
   * @returns Promise of ratelimit info (because we hit a 429) or `null` if we aren't being ratelimited.
   */
  handle(req: HttpRequest, res: HttpResponse) {
    return new Promise<RatelimitInfo>(async (resolve) => {
      const resetTime = Number(res.headers['x-ratelimit-reset']);
      const serverDate = res.headers.date;
      const remaining = res.headers['x-ratelimit-remaining'];

      this.resetTime = resetTime ? calculate(resetTime, serverDate!) : Date.now();
      this.remaining = remaining ? Number(remaining) : 0;

      // view https://github.com/discordapp/discord-api-docs/issues/182
      if (req.url.pathname.includes('reactions'))
        this.resetTime = new Date(serverDate!).getTime() - getAPIOffset(serverDate!) + 250;

      if (res.headers.hasOwnProperty('x-ratelimit-global')) {
        this._globalTimer = Util.sleep(Number(res.headers['retry-after']));
        await this._globalTimer;

        this._globalTimer = undefined;
      }

      if (res.statusCode === 429) {
        return resolve({
          ratelimited: true,
          remaining: this.remaining,
          resetTime: this.resetTime
        });
      } else {
        return resolve({
          ratelimited: false,
          remaining: this.remaining,
          resetTime: this.resetTime
        });
      }
    });
  }
}
