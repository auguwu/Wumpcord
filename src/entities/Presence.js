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

const { Collection } = require('@augu/immutable');
const Activity = require('./Activity');
const Base = require('./Base');
const Util = require('../util/Util');

/**
 * Represents a presence of a member on a Discord guild
 */
module.exports = class Presence extends Base {
  /**
   * Creates a new [Presence] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {PresencePacket} data The data packet
   */
  constructor(client, data) {
    super(data.user.id);

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The client's status
     * @type {ClientStatus}
     */
    this.clientStatus = {
      desktop: Util.get('desktop', false, data.client_status),
      website: Util.get('website', false, data.client_status),
      mobile: Util.get('mobile', false, data.client_status)
    };

    /**
     * The activities that the user is playing
     * @type {Collection<Activity> | null}
     */
    this.activities = client.canCache('presence:activity') ? new Collection() : null;

    this.patch(data);
  }

  /**
   * Patches this [Presence] instance
   * @param {PresencePacket} data The data
   */
  patch(data) {
    /**
     * The current status of the user
     * @type {'online' | 'offline' | 'dnd' | 'away'}
     */
    this.status = data.status || 'offline';

    /**
     * The current game
     * @type {GamePresence}
     */
    this.current = data.activities[0];

    /**
     * The current user or `null` if not cached
     * @type {import('./User') | null}
     */
    this.user = this.client.users.add(new (require('./User'))(this.client, data.user));

    if (data.activities) {
      if (this.client.canCache('presence:activity')) {
        for (let i = 0; i < data.activities.length; i++) {
          const activity = data.activities[i];
          this.activities.set(activity.id, new Activity(activity));
        }
      }
    }
  }
};

/**
 * @typedef {object} PresencePacket
 * @prop {PartialUser} user
 * @prop {'online' | 'offline' | 'dnd' | 'away'} status
 * @prop {RawClientStatus} client_status
 * @prop {PartialActivity[]} activities
 *
 * @typedef {object} GamePresence
 * @prop {number} type
 * @prop {string} name
 * @prop {string} id
 * @prop {PartialEmoji} emoji
 * @prop {number} created_at
 *
 * @typedef {object} PartialUser
 * @prop {string} id
 *
 * @typedef {object} PartialActivity
 * @prop {number} type
 * @prop {string} name
 * @prop {string} id
 * @prop {PartialEmoji} [emoji]
 * @prop {number} created_at
 * @prop {PartialTimestamp} [timestamps]
 * @prop {string} [state]
 * @prop {string} [session_id]
 * @prop {number} [flags]
 * @prop {string} [details]
 * @prop {PartialParty} [party]
 * @prop {PartialAssets} [assets]
 *
 * @typedef {object} PartialEmoji
 * @prop {string} name
 * @prop {string} id
 * @prop {boolean} animated
 *
 * @typedef {object} PartialTimestamp
 * @prop {number} start
 * @prop {number} end
 *
 * @typedef {object} PartialParty
 * @prop {string} id
 *
 * @typedef {object} PartialAssets
 * @prop {string} [large_text]
 * @prop {string} [large_image]
 * @prop {string} [small_text]
 * @prop {string} [small_image]
 *
 * @typedef {object} RawClientStatus
 * @prop {boolean} [desktop]
 * @prop {boolean} [mobile]
 * @prop {boolean} [web]
 *
 * @typedef {object} ClientStatus
 * @prop {boolean} desktop
 * @prop {boolean} mobile
 * @prop {boolean} website
 */
