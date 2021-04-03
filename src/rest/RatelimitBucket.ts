/**
 * Copyright (c) 2020-2021 August
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

import type { IncomingMessage } from 'http';

/**
 * Represents the ratelimit information for [[Ratelimit.handle]]
 */
export interface RatelimitInfo {
  /**
   * If we have been ratelimited or not
   */
  ratelimited: boolean;

  /**
   * How many times Wumpcord can create a request until being hit
   */
  remaining: number;

  /**
   * The reset duration in milliseconds
   */
  resetTime: number;
}

const getAPIOffset = (date: string) => new Date(date).getTime() - Date.now();
const calculate = (reset: number, serverDate: string) => new Date(reset * 1000).getTime() - getAPIOffset(serverDate);

/**
 * Represents a bucket for handling ratelimiting with Discord
 */
export class RatelimitBucket {
  /** The remaining requests we can do before locking the rest client */
  private remaining: number = 0;

  /** The reset timestamp */
  private resetTime: number = 0;

  /**
   * Handles ratelimiting
   * @param endpoint The endpoint
   * @param res The response from the http request
   * @returns Promise of ratelimit info (because we hit a 429) or `null` if we aren't being ratelimited.
   */
  handle(endpoint: string, req: IncomingMessage) {
    const resetTime = Number(req.headers['x-ratelimit-reset']);
    const serverDate = req.headers.date;
    const remaining = req.headers['x-ratelimit-remaining'];

    this.resetTime = resetTime ? calculate(resetTime, serverDate!) : Date.now();
    this.remaining = remaining ? Number(remaining) : 0;

    // view https://github.com/discordapp/discord-api-docs/issues/182
    if (endpoint.includes('reactions'))
      this.resetTime = new Date(serverDate!).getTime() - getAPIOffset(serverDate!) + 250;

    return {
      ratelimited: req.statusCode === 429,
      remaining: this.remaining,
      resetTime: this.resetTime
    };
  }
}
