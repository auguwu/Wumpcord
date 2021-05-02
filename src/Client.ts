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

/* eslint-disable @typescript-eslint/no-empty-interface */

import type { RestClientEvents as IRestClientEvents, RestClient } from '@wumpcord/rest';
import type { ShardEvents as IShardEvents } from './gateway/Shard';
import { ShardManager } from './gateway/ShardManager';
import type * as types from './types';
import { EventBus } from '@augu/utils';

type RestClientEvents = {
  [P in keyof IRestClientEvents as `rest${Capitalize<P>}`]: IRestClientEvents[P];
};

type ShardEvents = {
  [P in keyof IShardEvents as `shard${Capitalize<P>}`]: IShardEvents[P];
}

/**
 * Represents the default events that can emit with the attached [[WebSocketClient]].
 */
export interface WebSocketClientEvents extends EntityBasedEvents, RestClientEvents, ShardEvents {}
interface EntityBasedEvents {}

/**
 * Defines a "WebSocketClient", where this is your main entrypoint
 * of running your Discord bot! ✧･ﾟ: \*✧･ﾟ:\*(\*❦ω❦)\*:･ﾟ✧*:･ﾟ✧
 *
 * @typeparam O **~** Represents a custom object for creating libraries
 * of Wumpcord that extend the functionality of this class.
 *
 * @typeparam E **~** Represents a custom object for library creation
 * of this class to extend the event bus.
 */
export class WebSocketClient<
  O extends types.ClientOptions = types.ClientOptions,
  E extends WebSocketClientEvents = WebSocketClientEvents
> extends EventBus<E> {
  public options: Required<O>;
  public shards: ShardManager;
  public token!: string; // exposed in client, not in typings
  public ready: boolean = false;
  public rest: RestClient;
}
