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

import type { MessageContent, MessageContentOptions, TextableChannel } from '../types';
import type { Message } from '../models';
import type Command from './Command';

/** Represents the metadata for creating a new [CommandMessage] instance */
interface CommandMessageMetadata<C extends TextableChannel = TextableChannel> {
  /** The command execution context, if ran successfully */
  command?: Command;

  /** The message that was emitted */
  message: Message<C>;

  /** The raw arguments */
  args: string[];
}

/** Represents a Object of flags used from the command execution */
interface Flags {
  [x: string]: string | boolean;
}

const EQUALS_REGEX = /\s*=\s*/;

/**
 * Represents a [CommandMessage] instance, this is the bare-bones instance
 * of a [Message] that was passed from the command's execution context
 */
export default class CommandMessage<C extends TextableChannel = TextableChannel> {
  public command?: Command;
  public message: Message<C>;

  #rawArgs: string[];

  constructor(info: CommandMessageMetadata<C>) {
    this.#rawArgs = info.args;
    this.command = info.command;
    this.message = info.message;
  }

  /**
   * Returns a list of flags from the message
   *
   * Flags will return a `string` or a `boolean`, depending on the
   * flag type, if it has a `=` sign, then it's a string else it's a
   * boolean. If you are using TypeScript, you can use the `T` generic
   * to make sure you're possibly getting the right flags from this
   * function.
   *
   * @returns A object of flags keyed by the name and the value, if any
   */
  flags<T extends Flags = Flags>() {
    const obj = {} as T;
    const flags = this.#rawArgs.join(' ');

    if (!flags.includes('-')) return obj;

    const bits = flags.split('-').filter((flag, index) => index === 0 || flag !== '');
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];

      // Check if it doesn't have a `=` sign
      if (!bit.includes('=') || bit[0] === '=' || bit[bit.length - 1] === '=') {
        const name = bit.split(' ').filter((flag, index) => index === 0 || flag !== '').shift()!;

        // @ts-ignore You can index this as anything but it's keyed as T?
        obj[name] = true;
        continue;
      }

      const [name] = bit.split(EQUALS_REGEX);

      // @ts-ignore You can index this as anything but it's keyed as T?
      obj[name] = bit.slice(bit.indexOf('=')).trim();
    }

    return obj;
  }

  /**
   * Sends a message to the channel the command's execution
   * was in. This is way simplier than repeating `<CommandMessage>.message.channel.send()`.
   *
   * @param content The content to send
   * @param options Any additional options
   * @returns A new message emitted successfully or a REST error
   * if anything occured
   */
  send(content: MessageContent, options?: MessageContentOptions) {
    return this.message.channel!.send(content, options);
  }
}
