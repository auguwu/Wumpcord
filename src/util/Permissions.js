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

const Constants = require('../Constants');

/**
 * Represents a structure for Discord's permission system
 */
module.exports = class Permissions {
  /**
   * Creates a new [Permissions] class
   * @param {number} allow The allowed permissions
   * @param {number} [deny] The denied permissions
   */
  constructor(allow, deny = 0) {
    /**
     * The allowed permissions
     * @type {number}
     */
    this.allowed = allow;

    /**
     * The denied permissions
     * @type {number}
     */
    this.denied  = deny;
  }

  /**
   * Gets a JSON-like structure of all the permissions
   */
  toJSON() {
    if (!this.json) {
      this.json = {};

      for (const key of Object.keys(Constants.Permissions)) {
        if (!key.startsWith('all')) {
          if (this.allowed & Constants.Permissions[key]) this.json[key] = true;
          else if (this.denied & Constants.Permissions[key]) this.json[key] = false;
        }
      }
    } else {
      return this.json;
    }
  }

  /**
   * Checks if the permission is allowed or not
   * @param {string} perm The permission to check for
   * @returns {boolean} Boolean value if it is allowed or not
   * @arity Wumpcord.Permissions/1
   */
  has(perm) {
    if (!Constants.Permissions.hasOwnProperty(perm)) return false;
    
    return !!(this.allowed & Constants.Permissions[perm]);
  }
};
