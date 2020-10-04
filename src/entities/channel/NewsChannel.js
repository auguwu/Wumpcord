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

const PermissionOverwrite = require('../PermissionOverwrite');
const TextableChannel = require('./TextableChannel');
const { Collection } = require('@augu/immutable');
const { Endpoints } = require('../../Constants');
const Message = require('../Message');

/**
 * Represents a news channel on Discord
 */
module.exports = class NewsChannel extends TextableChannel {
  /**
   * Creates a new [NewsChannel] class
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {NewsChannelPacket} data The data
   */
  constructor(client, data) {
    super(client, data);

    /**
     * List of permission overwrites in this channel or `null` if not cachable
     * @type {Collection<PermissionOverwrite> | null}
     */
    this.permissionOverwrites = client.canCache('permission:overwrite') ? new Collection() : null;

    this.patch(data);
  }

  /**
   * Patches this [NewsChannel] instance
   * @param {NewsChannelPacket} data The data
   */
  patch(data) {
    /**
     * The topic of the channel, if applied
     * @type {?string}
     */
    this.topic = data.topic;

    /**
     * The channel's position
     * @type {number}
     */
    this.position = data.position;

    /**
     * The parent channel ID, if in a category channel
     * @type {?string}
     */
    this.parentID = data.parent_id;

    /**
     * If the channel is NSFW or not
     * @type {boolean}
     */
    this.nsfw = data.nsfw;

    /**
     * The name of the channel
     * @type {string}
     */
    this.name = data.name;

    /**
     * The last message's ID
     * @type {string}
     */
    this.lastMessageID = data.last_message_id;

    if (data.permission_overwrites) {
      if (this.client.canCache('overwrites')) {
        for (let i = 0; i < data.permission_overwrites.length; i++) {
          const overwrite = data.permission_overwrites[i];
          this.permissionOverwrites.set(overwrite.id, new PermissionOverwrite(overwrite));
        }
      }
    }

    return this;
  }

  /**
   * Gets the last message, if specified
   * @returns {Promise<Message>} The message or `null` if can't be fetched
   */
  getLastMessage() {
    if (this.lastMessageID === null) return null;

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.message(this.id, this.lastMessageID),
      method: 'get'
    })
      .then((data) => new Message(this.client, data))
      .catch(() => null);
  }
};

/**
 * @typedef {object} NewsChannelPacket
 * @prop {string} [topic]
 * @prop {number} position
 * @prop {import('../PermissionOverwrite').PermissionOverwritePacket[]} permission_overwrites
 * @prop {string} [parent_id]
 * @prop {boolean} nsfw
 * @prop {string} name
 * @prop {string} last_message_id
 * @prop {string} id
 */
