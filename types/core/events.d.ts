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

import * as entities from './discord';
import * as discord from 'discord-api-types/v8';
import * as core from '.';

interface PartialWithChannelEntity {
  channel: core.PartialEntity<core.TextableChannel>;
  id: string;
}

/**
 * Represents a [base event] class, to handle event-driven data from Discord.
 */
declare class BaseEvent<T> {
  /**
   * Represents a [base event] class, to handle event-driven data from Discord.
   * @param shard The shard that is handling the data
   * @param data The actual payload from Discord
   */
  constructor(shard: core.WebSocketShard, data: T);

  private client: core.Client;
  private shard: core.WebSocketShard;
  private data: T;

  private process(): core.MaybePromise<void>;
}

/**
 * List of available events
 */
declare namespace events {
  export class MessageCreateEvent extends BaseEvent<discord.GatewayMessageCreateDispatch['d']> {
    public channel: core.TextableChannel;
    public message: entities.Message;
    public guild?: entities.Guild;
  }

  export class MessageDeleteBulkEvent extends BaseEvent<discord.GatewayMessageDeleteBulkDispatch['d']> {
    public messages: (entities.Message | PartialWithChannelEntity)[];
    public channel: core.TextableChannel;
    public guild?: entities.Guild;
  }
}
