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
import { Snowflake } from '../util/Snowflake';

/**
 * Represents a base entity for entities to extend from
 */
export class BaseEntity<D extends any> {
  /**
   * The ID of this [[BaseEntity]].
   */
  public id: Snowflake;

  /**
   * Creates a new [[BaseEntity]] instance
   * @param id The ID from Discord
   */
  constructor(id: SnowflakeValue) {
    this.id = new Snowflake(id);
  }

  /**
   * Patches data from Discord, hidden from typings
   * @param data The data to use
   */
  patch(data: D) {
    // noop
  }

  /**
   * Returns when the entity was created at
   * @deprecated Use [[Snowflake.createdAt]] instead, this will be removed in a future release
   */
  get createdAt() {
    return this.id.createdAt;
  }
}