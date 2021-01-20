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
import type Argument from './Argument';

/**
 * Represents a type reader to read a argument's details
 * from the end user to validate and parse the output.
 */
export default class ArgumentTypeReader<T> {
  /** The bot instance */
  public bot: CommandClient;

  /** The reader's ID for providing the type */
  public id: string;

  /**
   * Represents a type reader to read a argument's details
   * from the end user to validate and parse the output.
   *
   * @param bot The bot instance
   * @param id The reader's ID
   */
  constructor(bot: CommandClient, id: string) {
    this.bot = bot;
    this.id = id;
  }

  /**
   * Validates the argument to return a boolean-represented value
   * if it was validated or not.
   *
   * @param msg The command's message
   * @param arg The found argument
   * @param raw The raw value by the end user
   * @throws {SyntaxError}: If the function wasn't overrided
   * @returns A boolean value if it was validated or not; it can also
   * return a Promise if the action should be asynchronous.
   */
  validate(msg: CommandMessage, arg: Argument, raw: string): boolean | Promise<boolean> {
    throw new SyntaxError('Missing overridable function call for [ArgumentTypeReader.validate]');
  }

  /**
   * Parses the argument to return the value.
   * @param msg The command's message
   * @param arg The found argument
   * @param raw The raw value by the end user
   * @throws {SyntaxError}: If the function wasn't overrided
   * @returns A value if it was validated or not; it can also
   * return a Promise if the action should be asynchronous.
   */
  parse(msg: CommandMessage, arg: Argument, raw: string): T | Promise<T> {
    throw new SyntaxError('Missing overridable function call for [ArgumentTypeReader.parse]');
  }
}
