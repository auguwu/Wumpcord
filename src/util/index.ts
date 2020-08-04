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

import { GatewayIntents } from './Constants';
import { constants } from 'buffer';

/**
 * Checks if a property exists in an object, returns a default value if none was provided
 * @param prop The property to find
 * @param defaultValue The default value if not found
 * @param options The options itself
 */
export function getOption<T extends object, U = unknown>(prop: keyof T, defaultValue: U, options?: T): U { // eslint-disable-line
  if (options === undefined) return defaultValue;
  else if (options.hasOwnProperty(prop)) return options[prop as any];
  else return defaultValue;
}

/**
 * Gets the bitmask of the gateway intents
 * @param intents The intents
 */
export function getIntentBitmask(intents: GatewayIntents[]) {
  let bitmask = 0;
  for (const intent of intents) {
    // You're asking:
    // "why are you using 'any', isn't that bad practice?"
    //
    // `GatewayIntents` is basically an object (when converted from TypeScript),
    // and you can't really do right-side operations because of:
    //
    // "The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type."" ts(2363)
    if (GatewayIntents[intent]) bitmask |= (<any> GatewayIntents)[intent];
  }

  return bitmask;
}