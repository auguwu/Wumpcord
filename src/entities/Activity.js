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

const { ActivityTypes } = require('../Constants');
const PartialEmoji = require('./partial/Emoji');

/**
 * Represents a presence activity
 */
module.exports = class Activity {
  /**
   * Creates a new [Activity] instance
   * @param {import('./Presence').PartialActivity} data The activity
   */
  constructor(data) {
    /**
     * The type of the activity
     * @type {number}
     */
    this.type = ActivityTypes[data.type] || '';

    /**
     * The name of the activity
     * @type {string}
     */
    this.name = data.name;

    /**
     * The date when it was created at
     * @type {Date}
     */
    this.createdAt = new Date(data.created_at);

    /**
     * The activity's ID, this is not a normal snowflake
     */
    this.id = data.id;

    this.patch(data);
  }

  /**
   * Patches this [Activity] instance
   * @param {import('./Presence').Activity} data The data
   */
  patch(data) {
    /**
     * Checks if this is an RPC running
     * @type {boolean}
     */
    this.rpc = data.hasOwnProperty('details') && data.hasOwnProperty('state');

    if (data.emoji !== undefined) {
      /**
       * The emoji of the custom status
       * @type {?Emoji}
       */
      this.emoji = new PartialEmoji(data.emoji);
    }

    // this is a RPC
    if (data.hasOwnProperty('details') && data.hasOwnProperty('state')) {
      /**
       * The timestamps of the activity
       * @type {{ start: number; end: number; }}
       */
      this.timestamps = data.timestamps || { start: 0, end: 0 };

      /**
       * The state of the RPC
       * @type {string}
       */
      this.state = data.state || null;

      /**
       * The details of the RPC
       * @type {string}
       */
      this.details = data.details || null;

      /**
       * The assets used
       * @type {?import('./Presence').PartialAssets}
       */
      this.assets = data.assets || null;

      /**
       * The party instance
       * @type {?{ id: string }}
       */
      this.party = data.party || null;

      if (data.sync_id !== undefined) {
        /**
         * The sync ID
         * @type {string}
         */
        this.syncID = data.sync_id;
      } else if (data.session_id !== undefined) {
        /**
         * The session ID
         * @type {string}
         */
        this.sessionID = data.session_id;
      } else {
        this.sessionID = this.syncID = null;
      }
    }
  }
};
