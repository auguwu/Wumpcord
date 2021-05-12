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

import { UnableToCreateEntityError } from '../errors/UnableToCreateEntityError';
import type { AbstractEntityCache } from '.';
import { Collection } from '@augu/collections';

/**
 * Represents cache that is pulled in-memory using collections provided
 * from `@augu/collections`. This is the default entity cache that is used
 * but you can create your own using a [[AbstractEntityCache]] or if you
 * don't need to cache anything specific, use the [[NoopEntityCache]] class
 * on specific entities or *all* of them.
 */
export class MemoryCache extends Collection<string, any> implements AbstractEntityCache {
  public name: string = 'memory';

  /**
   * @inheritdoc
   */
  get(id: string) {
    return this.get(id);
  }

  /**
   * @inheritdoc
   */
  put(data: any) {
    if (data === undefined)
      throw new UnableToCreateEntityError('Entity didn\'t specify any data', data);

    if ((data as any).id === undefined)
      throw new UnableToCreateEntityError('Entity didn\'t specify an ID, is this a malformed packet?', data);

    if (this.has((data as any).id)) {
      const cached = this.get((data as any).id);
      cached.patch?.(data);

      this.delete((data as any).id);
      this.set((data as any).id, cached);
      return cached;
    }

    this.set((data as any).id, data);
    return data;
  }

  /**
   * @inheritdoc
   */
  has(id: string) {
    return this.has(id);
  }

  /**
   * @inheritdoc
   */
  remove(id: string) {
    return this.delete(id);
  }
}
