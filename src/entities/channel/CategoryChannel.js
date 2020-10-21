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
const { Collection } = require('@augu/immutable');
const BaseChannel = require('../BaseChannel');

/**
 * Represents a category channel in Discord
 */
module.exports = class CategoryChannel extends BaseChannel {
  /**
   * Creates a new [CategoryChannel] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {CategoryChannelPacket} data The data
   */
  constructor(client, data) {
    super(data);

    /**
     * The client itself
     * @type {import('../../gateway/WebSocketClient')}
     * @private
     */
    this.client = client;

    /**
     * The children
     * @type {Collection<import('../BaseChannel')> | null}
     */
    this.children = client.canCache('channel') ? new Collection() : null;

    /**
     * List of permission overwrites
     * @type {Collection<PermissionOverwrite> | null}
     */
    this.permissionOverwrites = client.canCache('overwrites') ? new Collection() : null;

    this.patch(data);
  }

  /**
   * Patches this [CategoryChannel]
   * @param {CategoryChannelPacket} data The data
   */
  patch(data) {
    /**
     * The channel's position
     * @type {number}
     */
    this.position = data.position;

    /**
     * If the channel is NSFW or not
     * @type {boolean}
     */
    this.nsfw = data.nsfw;

    /**
     * The name of the category channel
     * @type {string}
     */
    this.name = data.name;

    if (this.client.canCache('channel')) {
      const children = this.client.channels.filter(channel => channel.parentID !== null && channel.parentID === this.id);
      if (children.length) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          this.children.set(child.id, child);
        }
      }
    }

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
};

/**
 * @typedef {object} CategoryChannelPacket
 * @prop {number} position
 * @prop {import('../PermissionOverwrite').PermissionOverwritePacket} permission_overwrites
 * @prop {string} [parent_id]
 * @prop {boolean} nsfw
 * @prop {string} name
 * @prop {string} id
 */
