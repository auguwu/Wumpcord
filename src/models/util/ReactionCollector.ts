/**
 * Copyright (c) 2020-2021 August, Ice
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

import type { GuildEmoji } from '..';
import { Collection } from '@augu/collections';
import EventBus from '../../util/EventBus';
import { Message } from '../Message';
import Util from '../../util';

type FilterFunction = (message: Message) => boolean;
type DisposeReason = 'end' | 'max.tries' | 'min.tries' | 'none';

interface ReactionCollectorEvents {
  dispose(reactions: Collection<string, GuildEmoji>, reason: DisposeReason): void;
  end(reactions: Collection<string, GuildEmoji>): void;
}

interface ReactionCollectorOptions {
  time?: number;
  max?: number;
}

export default class ReactionCollector extends EventBus<ReactionCollectorEvents> {
  private reactions: Collection<string, GuildEmoji>;
  private _timeout!: NodeJS.Timeout;
  private message: Message;
  private options: ReactionCollectorOptions;
  private filter: FilterFunction;

  constructor(
    message: Message,
    filter: FilterFunction,
    options: ReactionCollectorOptions
  ) {
    super();

    this.reactions = new Collection();
    this.message = message;
    this.options = Util.merge(options, {
      time: 60000,
      max: 10
    });

    this.filter = filter;
  }
}
