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

import type { Snowflake as SnowflakeValue } from 'discord-api-types';

/**
 * Represents a Snowflake, an ID-representation for Discord entities
 */
export class Snowflake {
  /**
   * The value provided from Discord
   */
  #id: string;

  /**
   * Returns Discord's epoch date for snowflake conversion (`'2015-01-01T00:00:00.000Z'`)
   */
  static get epoch() {
    return 1420070400000;
  }

  /**
   * Creates a new [[Snowflake]] instance
   * @param value The value Discord provided
   */
  constructor(value: SnowflakeValue) {
    this.#id = value;
  }

  /**
   * Returns the primitive value for this [[Snowflake]]
   */
  valueOf() {
    return this.#id;
  }

  /**
   * Returns when the entity was created at
   */
  get createdAt() {
    const delta = BigInt(this.#id) / 4194304n;
    return new Date(Math.floor(Number(delta + BigInt(Snowflake.epoch))));
  }
}
