/**
 * Copyright (c) 2020 August, Ice
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

/**
 * A resolvable thing
 */
export type Resolvable<T> = T | T[];

/**
 * All utilities available to Wumpcord
 */
export default class Util {
  constructor() {
    throw new SyntaxError('This class isn\'t supposed to be a constructable class, refrain from using `new`.');
  }

  /**
   * Gets a value from a object if it exists, if it doesn't, it'll use the provided [defaultValue].
   * @param obj The object to get the value from
   * @param prop The property to get the value from
   * @param defaultValue A default value, if provided
   * @returns The value if it exists or the [defaultValue] if it doesn't
   */
  static get<T extends object, K extends keyof T>(obj: T, prop: K, defaultValue: T[K]): T[K] {
    if (obj.hasOwnProperty(prop)) return obj[prop];
    else return defaultValue;
  }

  /**
   * Halts the process asynchronously for an amount of time
   * @param ms The amount of milliseconds to halt
   */
  static sleep(ms: number) {
    return new Promise<unknown>(resolve => setTimeout(resolve, ms));
  }

  /**
   * Merges 2 objects into one
   * @param given The given object
   * @param def The default object
   */
  static merge<T, U>(given: T, def: U): U {
    if (!given) return def;
    for (const key in def) {
      if (!Object.hasOwnProperty.call(given, key) || given[key as string] === undefined) given[key as string] = def[key];
      else if (given[key as string] === Object(given[key as string])) given[key as string] = Util.merge(def[key], given[key as string]);
    }

    // @ts-ignore shut up
    return given;
  }

  /**
   * Finds a object's key from it's initial value
   * @param obj The object
   * @param key The key to find
   * @returns The value found or `null` if not specified
   */
  static getKey<T extends object, K extends keyof T>(obj: T, key: T[K]): K {
    return Object
      .keys(obj)
      .find(val => obj[val] === key) as unknown as K;
  }
}
