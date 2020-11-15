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

const Base = require('./Base');

/**
 * Represents a voice-state of a user in a Discord voice channel
 */
module.exports = class VoiceState extends Base {
  /**
   * Creates a new [VoiceState] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {VoiceStatePacket} data The data packet
   */
  constructor(client, data) {
    super(data.id);

    /**
     * Object representing data of ourselves
     * @type {SelfVoiceState}
     */
    this.self = {
      muted: false,
      deafend: false,
      video: false
    };

    /**
     * Object representing data of server-related data
     * @type {ServerVoiceState}
     */
    this.server = {
      muted: false,
      deafend: false
    };

    /**
     * The current attached [WebSocketClient]
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches this [VoiceState] with the data received
   * @param {VoiceStatePacket} data The packet
   */
  patch(data) {
    if (data.channel_id !== undefined) {
      /**
       * The channel's ID
       * @type {string}
       */
      this.channelID = data.channel_id;

      /**
       * The session ID, if any
       * @type {string}
       */
      this.sessionID = data.channel_id === null ? null : data.session_id;
    } else {
      /**
       * The channel's ID, if any
       * @type {?string}
       */
      this.channelID = null;

      /**
       * The session ID, if any
       * @type {?string}
       */
      this.sessionID = null;
    }

    if (data.mute !== undefined) this.server.muted = data.mute;
    if (data.deaf !== undefined) this.server.deafend = data.deaf;

    if (data.suppress !== undefined) {
      /**
       * If we are suppresed or not, bots ignore this
       * @type {boolean}
       */
      this.suppress = data.suppress;
    }

    if (data.self_mute !== undefined) this.self.muted = data.self_mute;
    if (data.self_deaf !== undefined) this.self.deafend = data.self_deaf;
    if (data.self_video !== undefined) this.self.video = data.self_video;
    if (data.user_id !== undefined) {
      /**
       * The user's ID, if any
       * @type {?string}
       */
      this.userID = data.user_id;
    }
  }

  /**
   * Returns the [VoiceChannel] of this current [VoiceState]
   * @returns {import('./channel/VoiceChannel')} The voice channel
   */
  get channel() {
    return this.client.channels.get(this.channelID);
  }

  /**
   * Returns the [User] that using this [VoiceState]
   */
  get user() {
    return this.client.users.get(this.userID);
  }
};

/**
 * @typedef {object} VoiceStatePacket
 * @prop {string} user_id
 * @prop {boolean} suppress
 * @prop {string} session_id
 * @prop {boolean} self_video
 * @prop {boolean} self_mute
 * @prop {boolean} self_deaf
 * @prop {boolean} mute
 * @prop {boolean} deaf
 * @prop {string} channel_id
 *
 * @typedef {object} SelfVoiceState
 * @prop {boolean} muted
 * @prop {boolean} deafend
 * @prop {boolean} video
 *
 * @typedef {object} ServerVoiceState
 * @prop {boolean} muted
 * @prop {boolean} deafend
 */
