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
const BaseChannel = require('./BaseChannel');
const Attachment = require('./Attachment');
const Guild = require('./Guild');
const Base = require('./Base');
const Utilities = require('../util/Util');
const Constants = require('../Constants');
const Sticker = require('./Sticker');
const Editable = require('./wrappable/Editable');

/**
 * Checks if an object is a [MessageFile] instance
 * @param {unknown} obj The object
 * @returns {obj is import('./channel/DMChannel').MessageFile} Returns a boolean value if it is or not
 */
const isMessageFile = (obj) => typeof obj === 'object' && !Array.isArray(obj) && obj.hasOwnProperty('file');

/**
 * Represents a [Discord] message
 */
class Message extends Base {
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
     * The member instance, call [Message.getGuild] to populate it
     */
    this.member = null;

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
    this.author = data.author && this.client.canCache('user')
      ? this.client.users.get(data.author.id) || new (require('./User'))(this.client, data.author)
      : null;

    /**
     * The guild's ID
     */
    this.guildID = data.guild_id;

    /**
     * The edited messages made
     * @type {Collection<Message>}
     */
    this.edits = new Collection();

    /**
     * List of stickers available
     * @type {Sticker[]}
     */
    //this.stickers = data.stickers.map(data => new Sticker(data));

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

    // Insert if not in cache
    this.client.insert('user', this.author);

    // add this message to `edits`
    this.edits.set(this.id, this);
  }

  /**
   * Returns the edited message, if any
   */
  get edited() {
    return this.edits.last();
  }

  /**
   * Gets the guild and populates `member` and `guild`
   * @returns {Promise<Guild | null>} Returns the Guild instance or `null` if a REST error occured
   */
  async getGuild() {
    if (this.guild) return this.guild;

    try {
      const data = await this.client.rest.dispatch({
        endpoint: Endpoints.guild(this.guildID, true),
        method: 'get'
      });

      const guild = new Guild(this.client, data);
      this.client.insert('guild', guild);

      /**
       * The guild of this message
       * @type {Guild}
       */
      this.guild = guild;

      if (this.client.options.getAllUsers) {
        if (
          this.client.options.populatePresences &&
          !(this.client.intents & Constants.GatewayIntents.guildPresences)
        ) {
          this.client.emit('debug', 'Missing `guildPresences` intent');
          return guild;
        }

        const members = await this.guild.fetchMembers({
          limit: guild.maxMembers,
          presences: this.client.options.populatePresences && (this.client.intents & Constants.GatewayIntents.guildPresences),
          query: '',
          time: 120e3,
          nonce: Date.now().toString(16),
          force: false,
          userIds: []
        });

        if (!members) {
          this.client.emit('debug', 'Couldn\'t fetch member list, skipping...');
          return guild;
        }
      }

      return guild;
    } catch(ex) {
      return null;
    }
  }

  /**
   * Gets the channel and possibly caches it and populates [Message.channel]
   * @returns {Promise<import('./channel/TextChannel') | null>}
   */
  async getChannel() {
    if (this.channel) return this.channel;

    try {
      const data = await this.client.rest.dispatch({
        endpoint: Endpoints.channel(this.channelID),
        method: 'get'
      });

      const channel = BaseChannel.from(this.client, data);
      this.client.insert('channel', channel);

      /**
       * The current channel of this [Message]
       * @type {import('./channel/TextChannel')}
       */
      this.channel = channel;

      return channel;
    } catch(ex) {
      return null;
    }
  }

  /**
   * Deletes this message
   * @returns {Promise<boolean>} Boolean value if it was deleted or not
   */
  delete() {
    const channelID = this.channel ? this.channel.id : this.channelID;
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.message(channelID, this.id),
      method: 'delete'
    })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Edits the message
   * @param {string | import('./channel/DMChannel').CreateMessageOptions} content The content to send
   * @param {import('./channel/DMChannel').CreateMessageOptions} [options] Any additional options
   * @returns {Promise<Message>} Returns a message instance of the edited message or `null` if can't be patched
   */
  async edit(content, options) {
    let send;

    if (typeof content === 'string') {
      send = { content };
    } else if (typeof content === 'object') {
      if (Array.isArray(content))
        throw new Error('Cannot edit message with file(s).');
      else if (isMessageFile(content))
        throw new Error('Cannot edit message with file.');
      else {
        if (send.hasOwnProperty('content')) throw new SyntaxError('`content` is already populated');
        if (!send.hasOwnProperty('content') && content.hasOwnProperty('content')) send.content = content.content;
        if (content.hasOwnProperty('embed')) send.embed = content.embed;
        if (content.hasOwnProperty('allowedMentions')) send.allowed_mentions = Utilities.formatAllowedMentions(this.client, content.allowedMentions); // eslint-disable-line camelcase
      }
    } else if (typeof options === 'object') {
      if (Array.isArray(content))
        throw new Error('Cannot edit message with file(s).');
      else if (isMessageFile(content))
        throw new Error('Cannot edit message with file.');
      else {
        if (send.hasOwnProperty('content')) throw new SyntaxError('`content` is already populated');
        if (!send.hasOwnProperty('content') && options.hasOwnProperty('content')) send.content = options.content;
        if (options.hasOwnProperty('embed')) send.embed = options.embed;
        if (options.hasOwnProperty('allowedMentions')) send.allowed_mentions = Utilities.formatAllowedMentions(this.client, options.allowedMentions); // eslint-disable-line camelcase
      }
    } else {
      throw new SyntaxError('No content, file, or embed was specified.');
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.message(this.channel ? this.channel.id : this.channelID, this.id),
      method: 'patch',
      data: send
    })
      .then(data => new Message(this.client, data));
  }

  toString() {
    return `[Message "${this.content}" (${this.id})]`;
  }
}

// Adds methods from the "Editable" interface
//Editable.apply(Message);
module.exports = Message;

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
 * @prop {MessageReactionPacket[]} reactions
 * @prop {StickerPacket[]} stickers
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
 *
 * @typedef {object} MessageReactionPacket
 * @prop {number} count
 * @prop {boolean} me
 * @prop {import('./Emoji').EmojiPacket} emoji
 *
 * @typedef {object} StickerPacket
 * @prop {string} id
 * @prop {string} name
 * @prop {string} description
 * @prop {string} pack_id
 * @prop {string} asset
 * @prop {string} preview_asset
 * @prop {number} format_type
 * @prop {string} tags
 */
