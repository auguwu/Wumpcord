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

import type { MessageCreateEvent } from '../../events';
import type { TextableChannel } from '../../types';
import type WebSocketClient from '../../gateway/WebSocketClient';
import type { Message } from '../Message';
import { Collection } from '@augu/collections';
import EventBus from '../../util/EventBus';

export type Filter = (msg: Message) => boolean;

interface AwaitableMessage {
  resolve?(value: Message | PromiseLike<Message>): void;
  reject?(error?: any): void;

  timeout?: NodeJS.Timeout;
  filter: Filter;
  max?: number;
}

interface MessageCollectorEvents {
  collect(message: Message): void;
  end(reason: string, messages: Collection<string, Message>): void;
}

interface MessageCollectorOptions {
  time: number;
  max?: number;
}

export default class MessageCollector extends EventBus<MessageCollectorEvents> {
  public options: MessageCollectorOptions;

  #messages: Collection<string, Message>;
  #awaiting: { [x: string]: AwaitableMessage };
  #channel: TextableChannel;
  #client: WebSocketClient;
  #verify: (event: MessageCreateEvent) => void;

  constructor(client: WebSocketClient, channel: TextableChannel, options?: MessageCollectorOptions) {
    super();

    this.options = options ? options : { time: 30000 };
    this.#messages = new Collection();
    this.#awaiting = {};
    this.#channel = channel;
    this.#client = client;
    this.#verify = (event) => this._verify.call(this, event);
  }

  await(filter: Filter, userID: string, time: number = 30000) {
    // This should never happen but you never know...
    if (this.#awaiting[userID]) throw new TypeError(`User '${userID}' is already awaiting a message`);

    return new Promise<Message>((resolve, reject) => {
      this.#client.debug(`MessageCollector/${userID}/${this.#channel.id}`, 'Added pending packet to this MessageCollector! Awaiting...');
      this.#awaiting[userID] = {
        timeout: setTimeout(() => {
          delete this.#awaiting[userID];
          return reject(new Error('User has timed out this collector.'));
        }, time ?? this.options.time),
        resolve,
        reject,
        filter
      };

      this.#client.on('message', this.#verify);
    });
  }

  collect(filter: Filter, max?: number) {
    this.#client.debug(`MessageCollector/${this.#channel.id}`, 'Now awaiting bulk messages...');
    this.#awaiting[this.#channel.id] = {
      filter,
      max
    };

    this.#client.on('message', this.#verify);
  }

  end(channelID: string, reason: string) {
    const messages = this.#messages;
    this.emit('end', reason, messages);

    this.#client.remove('message', this.#verify);
    delete this.#awaiting[channelID];
  }

  private _verify(event: MessageCreateEvent) {
    // Check if a user has a pending packet
    if (this.#awaiting.hasOwnProperty(event.message.author.id)) {
      const packet = this.#awaiting[event.message.author.id];

      // If the filter hasn't bypassed the message, let's not continue
      if (!packet.filter(event.message)) return;

      // Clear the timeout, if any
      if (packet.timeout !== undefined)
        clearTimeout(packet.timeout);

      // Release it from heap
      delete this.#awaiting[event.message.author.id];

      // Remove the event from the listener stack
      this.#client.remove('message', this.#verify);

      // Resolve the message
      return packet.resolve?.(event.message);
    }

    // Check if it's in a channel
    if (this.#awaiting.hasOwnProperty(event.message.channelID)) {
      const packet = this.#awaiting[event.message.channelID];

      // If it doesn't bypass the filter, don't continue
      if (!packet.filter(event.message)) return;

      // Add it to the message cache
      this.#messages.set(event.message.id, event.message);

      // If we reached the max amount of message to collect
      // End this [MessageCollector] instance
      const size = packet.max !== undefined ? packet.max! : this.options.max ?? 10;
      if (this.#messages.size === size) return this.end(event.channel.id, 'max');

      // Emit the event and continue
      this.emit('collect', event.message);
    }
  }
}
