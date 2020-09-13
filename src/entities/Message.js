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
const { Endpoints } = require('../Constants');
const Attachment = require('./Attachment');
const Base = require('./Base');
const User = require('./User');

/**
 * Represents a [Discord] message
 */
module.exports = class Message extends Base {
  /**
   * Creates a new [Message] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {MessagePacket} data The data packet
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches this [Message] instance
   * @private
   * @param {MessagePacket} data The message packet
   * @arity Wumpcord.Entities.Message.patch/1
   */
  patch(data) {
    /**
     * If the message was used with TTS
     * @type {boolean}
     */
    this.tts = data.tts;

    /**
     * If the message includes `@everyone` or `@here`
     * @type {boolean}
     */
    this.mentionEveryone = data.mention_everyone;

    /**
     * The roles that were mentioned
     * @type {Collection<Role> | number}
     */
    this.mentionRoles = this.client.canCache('member:role') ? new Collection() : 0;

    /**
     * The users that were mentioned
     * @type {Collection<Role> | number}
     */
    this.mentions = this.client.canCache('user') ? new Collection() : 0;

    /**
     * The member instance
     */
    this.member = data.hasOwnProperty('member') ? data.member : null;

    /**
     * The message flags
     */
    this.flags = data.flags || 0;

    /**
     * The embeds included
     */
    this.embeds = data.embeds;

    /**
     * The edited timestamp, if wanted
     */
    this.editedTimestamp = data.edited_timestamp !== null ? new Date(data.edited_timestamp) : null;

    /**
     * The message content
     */
    this.content = data.content;

    /**
     * The channel's ID
     * @type {string}
     */
    this.channelID = data.channel_id;

    /**
     * The author
     */
    this.author = this.client.insert('user', new User(data.author));

    /**
     * The guild's ID
     */
    this.guild = data.guild_id;

    if (data.attachments) {
      /**
       * The list of attachments
       * @type {Collection<Attachment>}
       */
      this.attachments = new Collection();

      for (const packet of data.attachments) {
        const attachment = new Attachment(packet);
        this.attachments.set(attachment.id, attachment);
      }
    }
  }

  /**
   * Gets the guild
   */
  async getGuild() {
    try {
      const data = await this.client.rest.dispatch({
        endpoint: Endpoints.guild(this.id),
        method: 'get'
      });

      return data;
    } catch(ex) {
      return null;
    }
  }
};

/**
 * @typedef {object} MessagePacket
 * @prop {number} type
 * @prop {boolean} tts
 * @prop {string} timestamp
 * @prop {boolean} pinned
 * @prop {string[]} mentions
 * @prop {string[]} mention_roles
 * @prop {boolean} mention_everyone
 * @prop {GuildMemberPacket} member
 * @prop {string} id
 * @prop {MessageEmbedPacket[]} embeds
 * @prop {string} [edited_timestamp]
 * @prop {string} content
 * @prop {string} channel_id
 * @prop {UserPacket} author
 * @prop {AttachmentPacket[]} attachments
 * @prop {string} guild_id
 * 
 * @typedef {object} GuildMemberPacket
 * @prop {string[]} roles
 * @prop {string} premium_since 
 * @prop {string} [nick]
 * @prop {boolean} mute
 * @prop {string} joined_at
 * @prop {string} hoisted_role
 * @prop {boolean} deaf
 * 
 * @typedef {object} UserPacket
 * @prop {string} username
 * @prop {number} public_flags
 * @prop {string} id
 * @prop {string} discriminator
 * @prop {string} avatar
 */
