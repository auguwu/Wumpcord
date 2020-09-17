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
 * Represents a voice channel in Discord
 */
module.exports = class VoiceChannel extends BaseChannel {
  /**
   * Creates a new [VoiceChannel] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {VoiceChannelPacket} data The data
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

    /**
     * The limit of users allowed in this [VoiceChannel]
     * @type {number}
     */
    this.userLimit = data.user_limit;

    /**
     * The bitrate of the voice channel
     * @type {string}
     */
    this.bitrate = data.bitrate;

    if (data.permission_overwrites) {
      if (this.client.canCache('overwrites')) {
        for (let i = 0; i < data.permission_overwrites.length; i++) {
          const overwrite = data.permission_overwrites[i];
          this.permissionOverwrites.set(overwrite.id, new PermissionOverwrite(overwrite));
        }
      }
    }
  }
};

/**
 * @typedef {object} VoiceChannelPacket
 * @prop {number} position
 * @prop {import('../PermissionOverwrite').PermissionOverwritePacket} permission_overwrites
 * @prop {string} [parent_id]
 * @prop {boolean} nsfw
 * @prop {string} name
 * @prop {string} id
 * @prop {number} user_limit
 * @prop {number} bitrate
 */
