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

import type WebSocketClient from '../gateway/WebSocketClient';
import type WebSocketShard from '../gateway/WebSocketShard';
import type * as types from '../types';

/**
 * Represents a event from Discord and handles everything
 * @template D The data object structure
 * @template Refs The references available in this event's context
 */
export default class Event<D extends object, Refs extends object = {}> {
  /** The WebSocket client attached */
  public client: WebSocketClient;

  /** The WebSocket shard that is handling this event */
  public shard: WebSocketShard;

  /** The references attached to this [Event] */
  public $refs: Refs;

  /** The data payload from Discord */
  public data: D;

  /**
   * Represents a event from Discord and handles everything
   * @param shard The shard that is handling this event
   * @param data The data payload from Discord
   */
  constructor(shard: WebSocketShard, data: D) {
    // @ts-ignore Yes it is private, but I want to access it.
    this.client = shard.client;
    this.shard  = shard;
    this.$refs  = {} as Refs;
    this.data   = data;
  }

  process(): types.MaybePromise<any> {
    throw new TypeError('Overridable function [Event.process] is not implemented.');
  }
}
