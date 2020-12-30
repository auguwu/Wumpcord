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

const EPOCH = 1420070400000;
const DELTA = 4194304;

/**
 * Represents a base entity
 * @template D The data payload from Discord
 */
export default class Base<D extends object> {
  /** The entity's ID */
  public id!: string;

  /**
   * Creates a new [Base] instance
   * @param id The ID of the entity
   */
  constructor(id?: string) {
    if (id) this.id = id;
  }

  /**
   * Patches any updates from Discord
   * @param data The data payload
   */
  patch(data: D) {
    throw new SyntaxError('Overridable function [Base.patch] was not implemented.');
  }

  /**
   * Returns when the entity was created at
   */
  get createdAt() {
    return new Date(Math.floor(Number(this.id) / DELTA) + EPOCH);
  }

  toString() {
    return `[wumpcord.Base (${this.id ?? '<unknown>'})]`;
  }
}
