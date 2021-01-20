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

import type CommandMessage from '../CommandMessage';
import type CommandClient from '../CommandClient';
import ArgumentTypeReader from './ArgumentTypeReader';
import type Argument from './Argument';

/**
 * Represents a union literal of a [ArgumentTypeReader], this will parse
 * all unions and return the value that the user provided.
 */
export default class ArgumentUnionTypeReader<T> extends ArgumentTypeReader<T> {
  /** The types that were inferred from the union value */
  public types: ArgumentTypeReader<unknown>[];

  /** The ID of the union literal */
  public id: string;

  /**
   * Represents a union literal of a [ArgumentTypeReader], this will parse
   * all unions and return the value that the user provided.
   *
   * @param bot The bot instance
   * @param id The ID of the type
   */
  constructor(bot: CommandClient, id: string) {
    super(bot, id);

    this.types = [];
    this.id = id;

    const literals = id.split(' | ');
    for (let i = 0; i < literals.length; i++) {
      if (!this.bot.typeReaders.has(literals[i])) throw new TypeError(`Type Reader '${literals[i]}' doesn't exist.`);
      this.types.push(this.bot.typeReaders.get(literals[i])!);
    }
  }

  /**
   * Validates the argument to return a boolean-represented value
   * if it was validated or not.
   *
   * @param msg The command's message
   * @param arg The found argument
   * @param raw The raw value by the end user
   * @returns A boolean value if it was validated or not; it can also
   * return a Promise if the action should be asynchronous.
   */
  validate(msg: CommandMessage, arg: Argument, raw: string) {
    const results = this.types.map(t => t.validate(msg, arg, raw));
    return results.some(Boolean);
  }

  /**
   * Parses the argument to return the value.
   *
   * @param msg The command's message
   * @param arg The found argument
   * @param raw The raw value by the end user
   * @returns A value if it was validated or not; it can also
   * return a Promise if the action should be asynchronous.
   */
  parse(msg: CommandMessage, arg: Argument, raw: string) {
    const results = this.types.map(t => t.parse(msg, arg, raw));
    for (let i = 0; i < results.length; i++) {
      if (results[i]) return this.types[i].parse(msg, arg, raw) as T;
    }

    throw new TypeError(`Unable to parse value '${raw}' with union literal '${this.id}'`);
  }
}
