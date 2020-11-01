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
const Constants = require('../Constants');
const Sticker = require('./Sticker');
const Editable = require('./wrappable/Editable');
const Emoji = require('./Emoji');
const Util = require('../util/Util');
const PaginationBuilder = require('./utilities/PaginationBuilder');

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
    this.stickers = (data.stickers || []).map(data => new Sticker(data));

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
   * Cross-posts this message to all guilds, if the message's channel is considered a News Channel.
   * @returns {Promise<Message>} Returns the message that was cross-posted
   * or a REST error if anything occured
   */
  async crosspost() {
    const channel = this.channel ? this.channel : (await this.getChannel());
    if (channel.type !== 'news') throw new TypeError('The channel must be a news channel to crosspost this message.');

    return this.client.rest.dispatch({
      endpoint: `/channels/${this.channelID}/messages/${this.id}/crosspost`,
      method: 'POST'
    }).then(data => new this.constructor(this.client, data));
  }

  /**
   * Adds a reaction to the message. If the message hasn't been reacted, the bot will require the **Add Reactions**
   * permission else it'll require the **Read Message History** permission. Warn that `messageReactionAdd`
   * is emitted when this function is called.
   *
   * @param {string | import('./Emoji')} reaction The reaction to add,
   * if `reaction` is the `Emoji` class, it'll use `Emoji.mention` to parse the emoji
   * or you'll have to parse it yourself. You can use `Util.parseEmoji('id', 'name', animated)` to
   * parse it yourself.
   * @returns {Promise<void>} Returns an empty promise
   */
  react(reaction) {
    let emote;
    if (reaction instanceof Emoji) emote = `:${reaction.name}:${reaction.id}`;
    else {
      if (reaction === decodeURI(reaction)) emote = reaction;
      else if (reaction.startsWith(':')) emote = reaction;
      else throw new TypeError('Emote must be a unicode character or must be like ":name:id"');
    }

    return this.client.rest.dispatch({
      endpoint: `/channels/${this.channelID}/messages/${this.id}/reactions/${emote}/@me`,
      method: 'PUT'
    });
  }

  /**
   * Removes a reaction from this message that the bot has made, this method
   * will call the `messageReactionRemove` if there is more than 1 emote; else it'll
   * emit the `messageReactionRemoveEmoji`/`messageReactionRemoveAll` event(s).
   *
   * @param {string | Emoji} reaction The reaction to use,
   * this can be an instance of `Emoji` or a string. If you want
   * to pass in a custom emote, you can use the Emoji instance
   * or use the `Util.parseEmoji/3` utility function.
   *
   * @returns {Promise<void>} Empty promise of nothing.
   */
  unreact(reaction) {
    let emote;
    if (reaction instanceof Emoji) emote = `:${reaction.name}:${reaction.id}`;
    else {
      if (reaction === decodeURI(reaction)) emote = reaction;
      else if (reaction.startsWith(':')) emote = reaction;
      else throw new TypeError('Emote must be a unicode character or must be like ":name:id"');
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.messageReaction(this.channelID, this.id, emote),
      method: 'DELETE'
    });
  }

  /**
   * Gets all of the reactions in this [Message]
   * @param {string | Emoji} reaction The reaction to get the users from
   * @param {GetMessageReactionOptions} [options] The options to use
   * @returns {Promise<Array<import('./User')>>} Returns an array of users
   * who have reacted on this message
   */
  getReactions(reaction, options) {
    options = Util.merge(options, { limit: 100 });

    if (typeof options !== 'object' && !Array.isArray(options)) throw new TypeError(`Expected \`object\`, but received ${typeof options}`);
    if (options.before && typeof options.before !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.before}`);
    if (options.after && typeof options.after !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.after}`);
    if (options.limit) {
      if (typeof options.limit !== 'number') throw new TypeError(`Expected \`number\`, but gotten ${typeof options.limit}`);
      if (options.limit < 2 || options.limit > 100) throw new RangeError('Limit of reactions must be 2-100.');
    }

    let emote;
    if (reaction instanceof Emoji) emote = reaction.id;
    else {
      if (reaction === decodeURI(reaction)) emote = reaction;
    }

    let url = Endpoints.Channel.messageReaction(this.channelID, this.id, emote);
    const entries = Object.entries(options);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      const prefix = i === 0 ? '?' : '&';

      url += `${prefix}${key}=${value}`;
    }

    return this.client.rest.dispatch({
      endpoint: url,
      method: 'GET'
    }).then(data => data.map(user => new (require('../User'))(this.client, user)));
  }

  /**
   * Deletes all of the reactions on this message, this will emit the `messageReactionRemoveAll` event.
   * The bot would require the **Manage Messages** permission to execute this function.
   */
  deleteReactions() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.messageReactions(this.channelID, this.id),
      method: 'DELETE'
    });
  }

  /**
   * Deletes a single reaction, this will emit the `messageReactionRemoveEmoji`/`messageReactionRemove`
   * event. The bot would require the **Manage Messages** permission.
   *
   * @param {string | Emoji} reaction The reaction to remove from
   */
  deleteReaction(reaction) {
    let emote;
    if (reaction instanceof Emoji) emote = `:${reaction.name}:${reaction.id}`;
    else {
      if (reaction === decodeURI(reaction)) emote = reaction;
      else if (reaction.startsWith(':')) emote = reaction;
      else throw new TypeError('Emote must be a unicode character or must be like ":name:id"');
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Channel.messageReaction(this.channelID, this.id, emote),
      method: 'DELETE'
    });
  }

  /**
   * Pins this message to the current channel
   */
  async pin() {
    const channel = this.channel ? this.channel : (await this.getChannel());
    if (Util.isTextableChannel(channel)) return channel.pin(this);

    throw new TypeError(`Channel "${channel.id}" was not a textable channel`);
  }

  /**
   * Un-pins this message to the current channel
   */
  async unpin() {
    const channel = this.channel ? this.channel : (await this.getChannel());
    if (Util.isTextableChannel(channel)) return channel.unpin(this);

    throw new TypeError(`Channel "${channel.id}" was not a textable channel`);
  }

  /**
   * Creates a pagination builder instance of this [Message]
   * @param {import('./utilities/PaginationBuilder')} [options] The options to use
   */
  async paginate(options) {
    const builder = new PaginationBuilder(this, options);

    await builder.init();
    builder.run();
  }

  toString() {
    return `[Message "${this.content}" (${this.id})]`;
  }
}

// Adds methods from the "Editable" interface
Editable.decorate(Message);
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
 *
 * @typedef {object} GetMessageReactionOptions
 * @prop {string} [before]
 * @prop {string} [after]
 * @prop {number} [limit]
 */
