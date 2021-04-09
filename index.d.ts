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

/// Type Definitions for "wumpcord"
/// Project: https://github.com/auguwu/Wumpcord
/// Contributors:
///      - August <cutie@floofy.dev>

/* eslint-disable @typescript-eslint/no-empty-interface */

/**
 * Main entrypoint to `wumpcord`
 */
declare namespace Wumpcord {
  /**
   * The [[AbstractEntityCache]]'s purpose is to extend cache throughout Wumpcord
   * using any methods you want to use, i.e Redis. Note that all functions must
   * be synchronous due to the architecture on how entities and cach work.
   */
  export abstract class AbstractEntityCache {
    /**
     * Creates a new instance of this class.
     * @param name The name of this [[AbstractEntityCache]] class
     */
    constructor(name: string);

    /**
     * The name of this [[AbstractEntityCache]] class
     */
    public name: string;

    /**
     * Abstract method to return data from cache or `null` if nothing is found
     * @param id The Snowflake to use
     * @returns The entity found in cache or `null`.
     */
    abstract get(id: string): any;

    /**
     * Abstract method to add data to cache with the newly
     * entity created or an Error thrown if it couldn't
     * succeed.
     *
     * @param data The data from Discord
     * @returns The entity created or a [[UnableToCreateEntityError]] if something went wrong.
     */
    abstract put<D extends any = any>(data: D): D;

    /**
     * Abstract method to remove data from cache
     * @param id Snowflake to remove
     * @returns A boolean if it was successful or not
     */
    abstract remove(id: string): boolean;
  }

  /**
   * Represents cache that is pulled in-memory using collections provided
   * from `@augu/collections`. This is the default entity cache that is used
   * but you can create your own using a [[AbstractEntityCache]] or if you
   * don't need to cache anything specific, use the [[NoopEntityCache]] class
   * on specific entities or *all* of them.
   */
  export class MemoryCache extends Wumpcord.AbstractEntityCache {
    /** @inheritdoc */
    public get(id: string): any;

    /** @inheritdoc */
    public put<D extends any = any>(data: D): D;

    /** @inheritdoc */
    public remove(id: string): boolean;
  }

  export class NoopEntityCache extends Wumpcord.AbstractEntityCache {
    /** @inheritdoc */
    public get(id: string): undefined;

    /** @inheritdoc */
    public put<D extends any = any>(data: D): D;

    /** @inheritdoc */
    public remove(id: string): boolean;
  }
}

export = Wumpcord;
export as namespace Wumpcord;
