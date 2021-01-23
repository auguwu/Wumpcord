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

import type { ArgumentTypeReader } from '.';
import CommandClient from '../CommandClient';
import CommandMessage from '../CommandMessage';

/** The argument's information for creating a new [Argument] instance */
export interface ArgumentInfo {
  /**
   * A validation logic function for custom validation,
   * this is overrided from the `type` argument if provided.
   */
  validator?: ArgPredicate<boolean>;

  /**
   * If this argument is a rest parameter, it has infinite results.
   * This has to be the last argument or it'll error out.
   */
  infinite?: boolean;

  /**
   * If the argument is required
   */
  required: boolean;

  /**
   * Any default value if validation or parsing has failed,
   * and doesn't sliently fail.
   */
  default?: any;

  /**
   * Custom parser logic for custom parsing, this is
   * overrided from the `type` param if provided.
   */
  parser?: ArgPredicate<any>;

  /**
   * Prompt message to ask the end user what
   * they want to do with this argument.
   */
  prompt: string;

  /**
   * Any values that is ***strictly*** in this array or it'll
   * sliently error if it's any value is not in this array.
   */
  oneOf?: any[];

  /**
   * The type reader to use, you can make a union literal
   * reader by using the pipe syntax.
   */
  type: string;

  /**
   * The name of the argument, this will be added
   * in the argument object when passed down
   */
  name: string;

  /**
   * The maximum integer to pass in if the type is a float or integer.
   */
  max?: number;

  /**
   * The minimum integer to pass in if the type is a float or integer.
   */
  min?: number;
}

type ArgPredicate<T> = (msg: CommandMessage, arg: Argument, raw: string) => T | Promise<T>;

export default class Argument {
  public ['constructor']!: typeof Argument;

  /**
   * A validation logic function for custom validation,
   * this is overrided from the `type` argument if provided.
   */
  public validator?: ArgPredicate<boolean>;

  /**
   * If this argument is a rest parameter, it has infinite results.
   * This has to be the last argument or it'll error out.
   */
  public infinite: boolean;

  /**
   * If the argument is required
   */
  public required: boolean;

  /**
   * Any default value if validation or parsing has failed,
   * and doesn't sliently fail.
   */
  public default?: any;

  /**
   * Custom parser logic for custom parsing, this is
   * overrided from the `type` param if provided.
   */
  public parser?: ArgPredicate<any>;

  /**
   * Prompt message to ask the end user what
   * they want to do with this argument.
   */
  public prompt: string;

  /**
   * Any values that is ***strictly*** in this array or it'll
   * sliently error if it's any value is not in this array.
   */
  public oneOf?: any[];

  /**
   * The type reader to use, you can make a union literal
   * reader by using the pipe syntax.
   */
  public type!: ArgumentTypeReader<any>;

  /**
   * The name of the argument, this will be added
   * in the argument object when passed down
   */
  public name: string;

  /**
   * The maximum integer to pass in if the type is a float or integer.
   */
  public max?: number;

  /**
   * The minimum integer to pass in if the type is a float or integer.
   */
  public min?: number;

  #rawType: string;

  /**
   * Constructs a new [Argument] instance
   * @param info The argument's information
   */
  constructor(info: ArgumentInfo) {
    this.validator = info.validator;
    this.required = info.required ?? false;
    this.infinite = info.infinite ?? false;
    this.#rawType = info.type;
    this.default = info.default;
    this.parser = info.parser;
    this.prompt = info.prompt;
    this.oneOf = info.oneOf;
    this.name = info.name;
    this.max = info.max;
    this.min = info.min;
  }

  init(client: CommandClient) {
    this.type = client.resolveArgumentType(this.#rawType)!;

    return this;
  }

  format() {
    const prefix = this.required ? '<' : '[';
    const suffix = this.required ? '>' : ']';

    let format = `${prefix}${this.name}`;
    if (this.oneOf !== undefined) {
      format += `: ${this.oneOf.map(o => `"${typeof o === 'string' ? o : o.toString()}"`).join(' | ')}${suffix}`;
      return format;
    }

    format += `: ${this.type.id}`;
    if (this.default !== undefined)
      format += ` (${typeof this.default === 'string' ? this.default : this.default.toString()})`;

    format += suffix;
    return format;
  }

  validate(msg: CommandMessage, val: string) {
    if (this.validator !== undefined) return Promise.resolve(this.validator(msg, this, val));

    return Promise.resolve(this.type.validate(msg, this, val));
  }

  parse(msg: CommandMessage, val: string) {
    if (this.parser !== undefined) return Promise.resolve(this.parser(msg, this, val));

    return this.type.parse(msg, this, val);
  }
}
