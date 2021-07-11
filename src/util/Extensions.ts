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

import { Collection } from '@augu/collections';
import { BaseEntity } from '../entities/BaseEntity';

type Extendable = 'Guild' | 'Message' | 'TextChannel' | 'VoiceChannel';

const canExtend: Readonly<Extendable[]> = [
  'Guild',
  'Message',
  'TextChannel',
  'VoiceChannel'
] as const;

const extendables = new Collection<Extendable, typeof BaseEntity>();

/**
 * Represents a class that can extend any [[BaseEntity]] available.
 */
export class Extensions {
  /**
   * Returns the extendables collection (which isn't exported by default)
   */
  static get extenables() {
    return extendables;
  }

  /**
   * Returns an extendable object
   * @param obj The object type
   */
  static get<T extends BaseEntity<{}>, K extends Extendable>(key: K) {
    return this.extenables.get(key) as T | undefined;
  }

  /**
   * Extends a class and returns it
   * @param obj The extendable object name to use
   * @param callback A callback function of that specific class to extend from
   *
   * @example
   * ```js
   * const { Extensions } = require('wumpcord');
   * Extensions.extend('Message', Message => {
   *    class MyMessage extends Message {
   *       constructor(client, data) {
   *           super(client, data);
   *
   *           // Add properties if needed
   *       }
   *    }
   *
   *    return MyMessage;
   * });
   * ```
   *
   * @example
   * ```ts
   * // Using with TypeScript
   * // wumpcord.d.ts
   *
   * declare module 'wumpcord' {
   *   interface Message {
   *     // add in properties or methods here (make sure it's the same in `MyMessage`)
   *   }
   * }
   *
   * // index.ts
   * (client).on<TextChannel>('message', m => {
   *    // have type-safety to your props
   * });
   * ```
   */
  static extend<K extends Extendable>(key: K, callback: (value: typeof BaseEntity) => typeof BaseEntity) {
    if (!canExtend.includes(key))
      throw new TypeError(`Cannot extend key "${key}"`);

    // Returns the extendable object
    const current = this.extenables.get(key);
    if (current === undefined)
      throw new TypeError(`Extendable object "${key}" doesn't exist. :(`);

    const extendable = callback(current);
    this.extenables.delete(key);
    this.extenables.set(key, extendable);
  }
}
