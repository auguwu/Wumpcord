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

import type { Client } from '../Client';

const EPOCH = 1420070400000;
const DELTA = 4194304;

/**
 * Represents a "base" structure
 */
export abstract class Base {
  /**
   * The client itself
   */
  public client: Client;

  /**
   * Creates a new [Base]
   * @param client The client
   * @param id The ID (if provided)
   */
  constructor(client: Client, public id?: string) {
    this.client = client;
  }

  /**
   * Gets the timestamp of this [Base] was created (in Discord time)
   */
  get createdAt() {
    const time = Math.floor(Number(this.id!) / DELTA) + EPOCH;
    return new Date(time);
  }

  update(data: unknown) {
    throw new Error(`Entity with ID "${this.id}" doesn't implement Base#update`);
  }
}