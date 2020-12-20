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
import RatelimitedError from '../errors/RatelimitedError';
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
interface RequestDispatch {
  /** The headers to send out */
  headers?: { [x: string]: any };

  /** The endpoint to make the request to */
  endpoint: string;

  /** The http method verb to use */
  method: HttpMethod;

  /** Any data to send to Discord */
  data?: any;
}

/**
 * Represents a class to handle requests to Discord
 */
export default class RestClient {
  /** The last time the rest client has dispatched a request (when [RestClient.dispatch] was called) */
  public lastDispatchedAt: number = -1;

  /** If we are being ratelimited or not */
  public ratelimited: boolean = false;
}
