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

import { Permissions } from '../Constants';

/**
 * Utility to handle permissions
 */
export default class Permission {
  /** The bit for the allowed permission */
  public allow: number;

  /** The bit for the denied permission */
  public denied: number;

  /**
   * Utility to handle permissions
   * @param allow The allowed permission
   * @param deny The denied permissions
   */
  constructor(allow: string, deny: string = '0') {
    this.denied = Number(deny);
    this.allow = Number(allow);
  }

  /**
   * Returns a JSON structure of all the permissions available to this class
   */
  toJSON() {
    const json: { [x: string]: boolean } = {};
    for (const key of Object.keys(Permissions)) {
      if (!key.startsWith('all')) {
        if (this.allow & Permissions[key])
          json[key] = true;
        else if (this.denied & Permissions[key])
          json[key] = false;
      }
    }

    return json;
  }

  /**
   * Checks if `key` exists in the bitfield
   * @param key The key to check
   */
  has(key: string) {
    if (!Permissions.hasOwnProperty(key)) return false;

    return !!(this.allow & Permissions[key]);
  }
}
