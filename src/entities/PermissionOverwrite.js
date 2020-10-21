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

const Permissions = require('../util/Permissions');
const Base = require('./Base');

/**
 * Represents the permission overwrites of a channel
 */
module.exports = class PermissionOverwrite extends Base {
  /**
   * Creates a new [PermissionOverwrite] instance
   * @param {PermissionOverwritePacket} data The data
   */
  constructor(data) {
    super(data.id);

    this.patch(data);
  }

  /**
   * Patches this [PermissionOverwrite] class
   * @param {PermissionOverwritePacket} data The data
   */
  patch(data) {
    /**
     * The type of the permission overwrite
     * @type {'role' | 'member'}
     */
    this.type = data.type;

    /**
     * The permissions class to handle permission-checking
     * @type {Permissions}
     */
    this.permissions = new Permissions(data.allow, data.deny);
  }
};

// we don't use 'deny_new' or 'allow_new' because
// it returns a string and we don't need that
/**
 * @typedef {object} PermissionOverwritePacket
 * @prop {'role' | 'member'} type
 * @prop {string} id
 * @prop {number} deny
 * @prop {number} allow
 */
