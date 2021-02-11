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

import { EventBus } from '@augu/utils';

interface CacheProviderEvents {
  /**
   * Emitted when we open a connection, if [CacheProvider.connect]
   * is implemented.
   */
  connected(): void;

  /**
   * Emitted when we disposed a connection, if [CacheProvider.disposed]
   * is implemented.
   */
  disposed(): void;
}

/**
 * Represents a cache provider that is *synchronous*. We do not allow
 * asynchronous actions on the provider due to architecture-related reasons
 * with the library.
 *
 * This has 3 function you *must* override or it'll error out
 * with a [SyntaxError]. Functions being `connect`, `dispose`,
 * `get`, `add`, and `remove`.
 *
 * If the provider needs to be connected to a external source i.e Redis,
 * implement `connect` and `dispose` to safely connect to the external
 * source or dispose the connection so it doesn't bleed.
 *
 * `get`, `add`, and `remove` are self-explaintory and must be
 * implemented.
 */
export default class CacheProvider extends EventBus<CacheProviderEvents> {
  /** The provider's name */
  public name: string;

  /**
   * Constructs a new [CacheProvider] instance
   * @param name The name of the provider
   */
  constructor(name: string) {
    super();

    this.name = name;
  }

  add(key: string, value: any) {
    throw new SyntaxError('Missing implementation of `CacheProvider.add`');
  }

  get(id: string) {
    throw new SyntaxError('Missing implementation details of `CacheProvider.get`');
  }

  remove(id: string) {
    throw new SyntaxError('Missing implementation details of `CacheProvider.remove`');
  }

  connect() {
    throw new SyntaxError('Missing implementation details of `CacheProvider.connect`');
  }

  dispose() {
    throw new SyntaxError('Missing implementation details of `CacheProvider.dispose`');
  }
}
