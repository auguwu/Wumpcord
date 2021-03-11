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

import DiscordRestValidationError from '../errors/DiscordRestValidationError';
import RequestAbortedError from '../errors/RequestAbortedError';
import DiscordRestError from '../errors/DiscordRestError';
import DiscordAPIError from '../errors/DiscordAPIError';
import RatelimitBucket from './RatelimitBucket';
import * as Constants from '../Constants';
import type Client from '../gateway/WebSocketClient';
import * as types from '../types';
import { Queue } from '@augu/collections';
import FormData from 'form-data';
import https from 'https';
import Util from '../util';
import { runInThisContext } from 'node:vm';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  | 'connect'
  | 'options'
  | 'trace';

/**
 * Represents a dispatched request
 */
interface RequestDispatch<T = unknown> {
  /** discord is bullshit so this is here because yes i mean- The audit log reason to show up */
  auditLogReason?: string;

  /** The headers to send out */
  headers?: { [x: string]: any };

  /** The endpoint to make the request to */
  endpoint: string;

  /** The http method verb to use */
  method: HttpMethod;

  /** A file packet to send to Discord */
  file?: types.MessageFile | types.MessageFile[];

  /** Any data to send to Discord */
  data?: T;
}

interface DiscordRequest<D = unknown> extends RequestDispatch<D> {
  resolve(value: D | PromiseLike<D>): void;
  reject(error?: Error): void;
}

// These don't require `content-type` headers
const ContentMethods: readonly string[] = ['get', 'head', 'GET', 'HEAD'] as const;

/**
 * Represents a class to handle requests to Discord
 */
export default class RestClient {
  protected _ratelimitTimes: { [x: string]: number } = {};
  protected _lockTimeout?: NodeJS.Timer;

  /** The last time the rest client has dispatched a request (when [RestClient.dispatch] was called) */
  public lastDispatchedAt: number = -1;

  /** If we are being ratelimited or not */
  public ratelimited: boolean = false;

  /** If we are currently handling a request until completion */
  public handling: boolean = false;

  /** The last rest call from Discord (when we receive a payload from [RestClient._handleRequest]) */
  public lastCallAt: number = -1;

  /** List of requests to dispatch */
  private requests: Queue<DiscordRequest>;

  /** If we are locked from making anymore requests */
  public locked: boolean;

  #client: Client;

  /**
   * Represents a class to handle requests to Discord
   * @param client The client to use
   */
  constructor(client: Client) {
    this.lastDispatchedAt = -1;
    this.ratelimited = false;
    this.lastCallAt = -1;
    this.requests = new Queue();
    this.locked = false;
    this.#client = client;
  }

  /**
   * Gets the current ping of the rest client
   */
  get ping() {
    return this.lastDispatchedAt === -1 ? 0 : (this.lastCallAt - this.lastDispatchedAt);
  }

  /**
   * Dispatch a request to Discord
   * @param options The request options
   * @typeparam TReturn The return value when dispatched
   * @typeparam Data The request data to send to Discord
   */
  dispatch<TReturn, Data = unknown>(options: RequestDispatch<Data>) {
    return new Promise<TReturn>((resolve, reject) => {
      const request: DiscordRequest = {
        headers: Util.get(options, 'headers', {}),
        endpoint: options.endpoint,
        method: options.method,
        data: Util.get(options, 'data', undefined),
        file: Util.get(options, 'file', undefined),
        resolve,
        reject
      };

      if (this.locked) {
        return reject(new Error('[RestClient] is currently locked from making requests'));
      }

      this.requests.push(request);
      this.execute();
    });
  }

  execute() {
    if (this.handling) return;

    const request = this.requests.shift()!;
    this.handling = true;
    return this
      ._executeRequest(request)
      .then((data: any) => {
        this.handling = false;
        request.resolve(data);

        if (this.requests.size() > 0)
          this.execute();
      })
      .catch((error) => {
        request.reject(error);

        if (this.requests.size() > 0)
          this.execute();
      });
  }

  /**
   * Executes the request and handles ratelimiting
   * @param request The dispatched requeest
   */
  private async _executeRequest<T>(request: RequestDispatch) {
    const bucket = new RatelimitBucket();
    const form = request.file !== undefined ? new FormData() : null;

    if (
      !ContentMethods.includes(request.method) &&
      !request.headers!.hasOwnProperty('content-type')
    ) {
      request.headers!['content-type'] = 'application/json';
    }

    if (request.auditLogReason !== undefined)
      request.headers!['x-audit-log-reason'] = encodeURIComponent(request.auditLogReason);

    if (form !== null)
      request.headers!['content-type'] = form.getHeaders()['content-type'];

    return new Promise<T>(async (resolve, reject) => {
      const req = https.request({
        protocol: 'https:',
        headers: {
          'User-Agent': Constants.UserAgent,
          Authorization: `Bot ${this.#client.token}`,
          ...(request.headers ?? {})
        },
        method: request.method,
        path: `/api/v${Constants.RestVersion}${request.endpoint}`,
        port: 443,
        host: 'discord.com'
      });

      const buffers: Buffer[] = [];
      let error!: Error;

      req.once('abort', () => {
        const err = error ?? new RequestAbortedError(request.endpoint, request.method);
        return reject(err);
      });

      req.once('error', err => {
        error = err;
        req.abort();
      });

      req.once('response', res => {
        this.lastCallAt = Date.now();
        this.#client.debug('RestClient/Request', `Received "${res.statusCode} ${res.statusMessage}" on "${request.method.toUpperCase()} ${request.endpoint}"`);

        res.on('data', chunk => buffers.push(chunk));
        res.once('error', err => {
          error = err;
          req.abort();
        });

        res.on('end', async () => {
          if (res.statusCode! === 204) return resolve(null as any);

          const body = Buffer.concat(buffers);
          let resp;

          try {
            resp = JSON.parse(body.toString());
          } catch(ex) {
            this.#client.emit('error', new Error('Unable to parse JSON body from Discord'));
            return reject(new Error('Unable to parse JSON body from Discord'));
          }

          if (res.statusCode! !== 204 && body.length === 0) {
            this.#client.debug('RestClient/Response', 'Received empty body from Discord with the wrong status code.');
            this.#client.emit('restEmpty');

            return reject(new DiscordAPIError(500035, 'Received empty body from Discord with the wrong status code.'));
          }

          if (res.statusCode! === 204) return resolve(null as any);

          const ratelimit = bucket.handle(request.endpoint, res);
          if (ratelimit.ratelimited) {
            this.locked = true;
            this.#client.debug('RestClient/Response', `Ratelimited on "${request.method.toUpperCase()} ${request.endpoint}", rest client is locked for ~${res.headers['retry-after']}ms`);

            if (this._ratelimitTimes[request.endpoint] > 5) {
              return reject(new DiscordAPIError(429, `Too Many Requests on "${request.method.toUpperCase()} ${request.endpoint}"`));
            }

            this._ratelimitTimes[request.endpoint] = (this._ratelimitTimes[request.endpoint] ?? 0) + 1;
            this._lockTimeout = setTimeout(() => {
              this.#client.debug('RestClient', `Attempting to request to "${request.method.toUpperCase()} ${request.endpoint}" again...`);

              // clear the global lock
              this._lockTimeout = undefined;
              return this
                ._executeRequest<any>(request)
                .then(resolve)
                .catch(reject);
            }, parseInt(res.headers['retry-after']!) * 1000);

            return; // don't continue
          }

          if (res.statusCode! === 502) {
            this.#client.emit('restUnavailable');
            return reject(new DiscordAPIError(502, 'Rest is unavailable at this time (https://discordstatus.com)'));
          }

          this.#client.emit('restCall', {
            ratelimitInfo: ratelimit,
            successful: res.statusCode! <= 300 || res.statusCode! > 400,
            endpoint: request.endpoint,
            method: request.method,
            body: body.toString(),
            ping: this.ping
          });

          if (resp.hasOwnProperty('code')) {
            if (resp.hasOwnProperty('errors')) {
              let errors: any[] = [];
              for (const key of Object.keys(resp.errors)) {
                const error = (resp.errors[key]?._errors ?? []).map(data => ({ ...data, key }));
                if (error.length > 0) errors = errors.concat(error);
              }

              return reject(new DiscordRestValidationError(
                request.endpoint,
                request.method,
                resp.code,
                resp.message,
                errors
              ));
            } else {
              return reject(new DiscordRestError(resp.code, resp.message));
            }
          } else {
            return resolve(resp);
          }
        });
      });

      req.setTimeout(30000, () => {
        this.#client.debug('RestClient', `Request was timed out (>30s) on "${request.method.toUpperCase()} ${request.endpoint}"`);
        error = new Error(`Request was timed out (>30s) on "${request.method.toUpperCase()} ${request.endpoint}"`);
        req.abort();
      });

      if (request.file !== undefined) {
        request.headers!['content-type'] = form!.getHeaders()['content-type'];

        if (Array.isArray(request.file)) {
          for (let i = 0; i < request.file.length; i++) {
            const file = request.file[i];
            if (!file.name) file.name = 'file.png';

            if (Util.isReadableStream(file.file))
              file.file = await Util.readableToBuffer(file.file);

            form!.append(file.name, file.file, { filename: file.name });
          }
        } else {
          if (!request.file.name)
            request.file.name = 'file.png';

          if (Util.isReadableStream(request.file.file))
            request.file.file = await Util.readableToBuffer(request.file.file);

          form!.append(request.file.name, request.file.file, { filename: request.file.name });
        }
      }

      if (form !== null) {
        if (request.data !== undefined) form.append('payload_json', JSON.stringify(request.data));
        form.pipe(req);
      } else {
        if (request.data !== undefined) req.write(JSON.stringify(request.data));

        req.end();
      }
    });
  }
}
