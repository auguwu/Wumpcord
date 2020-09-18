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

const { UserFlags, CdnUrl, Endpoints } = require('../Constants');
const DMChannel = require('./channel/DMChannel');
const Base = require('./Base');

module.exports = class User extends Base {
  /**
   * Creates a new [User] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {UserPacket} data The data
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The public flags the user has
     * @type {number}
     */
    this.flags = data.public_flags;

    /**
     * The user's username
     * @type {string}
     */
    this.username = data.username;

    /**
     * The user's discriminator
     * @type {string}
     */
    this.discriminator = data.discriminator;

    /**
     * The user's avatar UUID
     * @type {string}
     */
    this.avatar = data.avatar;
  }

  /**
   * Getter to check if the user is a Discord Staff member
   */
  get staff() {
    return !!(this.flags & UserFlags.Staff);
  }

  /**
   * Getter to check if the user is a Partnered server owner
   */
  get partner() {
    return !!(this.flags & UserFlags.Partner);
  }

  /**
   * Getter to check if the user is apart of the Hypesquad Events program
   */
  get hypesquad() {
    return !!(this.flags & UserFlags.HypesquadEvents);
  }

  /**
   * Gets the user's current Hypesquad house
   */
  get house() {
    if (this.flags & UserFlags.Bravery) return 'bravery';
    else if (this.flags & UserFlags.Balance) return 'balance'; // best one dont @ me :)
    else if (this.flags & UserFlags.Brilliance) return 'brilliance';
    else return 'none';
  }

  /**
   * Getter to check if they are a Early Supporter
   */
  get earlySupporter() {
    return !!(this.flags & UserFlags.EarlySupported);
  }

  /**
   * Gets the user's current bug hunter level
   */
  get bugHunterLevel() {
    if (this.flags & UserFlags.BugHunterLevel1) return 1;
    else if (this.flags & UserFlags.BugHunterLevel2) return 2;
    else return 0;
  }

  /**
   * Gets the user's default avatar UUID
   */
  get defaultAvatar() {
    const discrim = Number(this.discriminator);
    return discrim % 5;
  }

  /**
   * Gets the user's default avatar URL
   */
  get defaultAvatarUrl() {
    return `${CdnUrl}/avatars/${this.defaultAvatar}.png`;
  }

  /**
   * Gets the user's avatar URL
   */
  get avatarUrl() {
    return this.avatar === null ? this.defaultAvatarUrl : Endpoints.CDN.getUserAvatar(this.id, this.avatar);
  }

  /**
   * Returns the user's tag
   */
  get tag() {
    return `${this.username}#${this.discriminator}`;
  }

  /**
   * Gets the user's mention
   */
  get mention() {
    return `<@${this.id}>`;
  }

  /**
   * Gets the user's DM channel
   * @returns {Promise<DMChannel | null>} The channel or `null` if an REST error occurs
   */
  async getDMChannel() {
    try {
      const data = await this.client.rest.dispatch({
        endpoint: '/users/@me/channels',
        method: 'post',
        data: {
          recipients: [this.id],
          type: 1
        }
      });

      const channel = new DMChannel(this.client, data);
      this.client.insert('channel', channel);

      return channel;
    } catch(ex) {
      return null;
    }
  }

  toString() {
    return `[User ${this.tag} (${this.id})]`;
  }
};

/**
 * @typedef {object} UserPacket
 * @prop {string} username
 * @prop {number} public_flags
 * @prop {string} id
 * @prop {string} discriminator
 * @prop {string} [avatar]
 */
