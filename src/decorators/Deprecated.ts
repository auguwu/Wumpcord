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

/**
 * Namespace for internal tools related to deprecating anything.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Deprecated {
  /**
   * Wraps a factory function to mark that factory function deprecated.
   * @param factory The factory function to use
   * @returns A function that shows a deprecation message
   * @internal
   */
  export function deprecate<
    F extends (...args: any[]) => any,
    Args extends any[] = Parameters<F>,
    TReturn = ReturnType<F>
  >(factory: F): (...args: Args) => TReturn {
    return (...args) => {
      console.log(`(wumpcord:${process.pid}) DeprecationWarning: Function ${factory.name} is deprecated and will be removed in a future release.`);
      return factory(...args);
    };
  }

  /**
   * Deprecates a method in a class
   * @internal
   */
  export const Method: MethodDecorator = (target, prop, descriptor: TypedPropertyDescriptor<any>) => {
    const original = descriptor.value;
    descriptor.value = (...args: any[]) => {
      console.log(`(wumpcord:${process.pid}) DeprecationWarning: Method "${target.constructor.name}#${String(prop)}" is deprecated and will be removed in a future release.`);
      return original(...args);
    };

    return descriptor;
  };
}
