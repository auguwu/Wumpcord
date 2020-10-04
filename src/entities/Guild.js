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
/* eslint-disable camelcase */

const { OPCodes, Endpoints } = require('../Constants');
const UnavailableGuild = require('./UnavailableGuild');
const { Collection } = require('@augu/immutable');
const VoiceState = require('./VoiceState');
const BaseChannel = require('./BaseChannel');
const Presence = require('./Presence');
const Member = require('./GuildMember');
const Role = require('./Role');
const Emoji = require('./Emoji');
const Util = require('../util/Util');

/**
 * Represents a Discord guild
 */
module.exports = class Guild extends UnavailableGuild {
  /**
   * Creates a new [Guild] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   * @param {GuildPacket} data The data to use
   */
  constructor(client, data) {
    super(data);

    /**
     * The channels cache or `null` if not cachable
     * @type {Collection<import('./BaseChannel')> | null}
     */
    this.channels = client.canCache('channel') ? new Collection() : null;

    /**
     * The members cache or `null` if not cachable
     * @type {Collection<import('./GuildMember')> | null}
     */
    this.members = client.canCache('member') ? new Collection() : null;

    /**
     * The role cache or `null` if not cachable
     * @type {Collection<import('./Role')> | null}
     */
    this.roles = client.canCache('member:role') ? new Collection() : null;

    /**
     * The emoji cache or `null` if not cachable
     * @type {Collection<import('./Emoji')> | null}
     */
    this.emojis = client.canCache('emoji') ? new Collection() : null;

    /**
     * The voice state cache or `null` if not cachable
     * @type {Collection<import('./VoiceState')> | null}
     */
    this.voiceStates = client.canCache('voice:state') ? new Collection() : null;

    /**
     * The presence cache or `null` if not cachable
     * @type {Collection<import('./Presence') | null>}
     */
    this.presences = client.canCache('presence') ? new Collection() : null;

    /**
     * The client instance
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    // Calls "patch" to add more metadata
    this.patch(data);
  }

  /**
   * Populates everything else from Discord to this [Guild] instance
   * @param {GuildPacket} data The data
   */
  patch(data) {
    /**
     * The icon of the guild or `null` if not available
     * @type {?string}
     */
    this.icon = data.icon;

    /**
     * The description of the guild or `null` if there isn't one set
     * @type {?string}
     */
    this.description = data.description;

    /**
     * The splash UUID of the guild or `null` if there is none set
     * @type {?string}
     */
    this.splash = data.splash;

    /**
     * The discovery splash UUID of the guild or `null` if there is none set
     * @type {?string}
     */
    this.discoverySplash = data.discovery_splash;

    /**
     * List of features the guild has
     * @type {import('../Constants').Feature[]}
     */
    this.features = data.features;

    /**
     * The guild's banner UUID or `null` if none is presented
     * @type {?string}
     */
    this.banner = data.banner;

    /**
     * The owner of the guild, mapped by it's ID
     * @type {string}
     */
    this.ownerID = data.owner_id;

    /**
     * The application ID the guild belongs to
     * @type {?string}
     */
    this.applicationID = data.application_id;

    /**
     * The region the guild belongs to
     * @type {string}
     */
    this.region = data.region;

    /**
     * The AFK channel ID, or `null` if none is mapped
     * @type {?string}
     */
    this.afkChannelID = data.afk_channel_id;

    /**
     * The AFK timeout
     * @type {number}
     */
    this.afkTimeout = data.afk_timeout;

    /**
     * The channel ID for system-related content
     * @type {string}
     */
    this.systemChannelID = data.system_channel_id;

    /**
     * If the widget is enabled or not
     * @type {boolean}
     */
    this.widgetEnabled = data.widget_enabled;

    /**
     * The widget's channel ID
     * @type {?string}
     */
    this.widgetChannelID = data.widget_channel_id;

    /**
     * The verification level of the guild
     * @type {number}
     */
    this.verificationLevel = data.verification_level;

    /**
     * The default message notification type
     * @type {number}
     */
    this.defaultMessageNotifications = data.default_message_notifications;

    /**
     * The MFA level type of the guild
     * @type {number}
     */
    this.mfaLevel = data.mfa_level;

    /**
     * The explicit content filter type
     * @type {number}
     */
    this.explicitContentFilter = data.explicit_content_filter;

    /**
     * The max presences available, this will be `0` if `?with_counts` wasn't specified
     * @type {?number}
     */
    this.maxPresences = data.max_presences || 0;

    /**
     * The max members available
     * @type {number}
     */
    this.maxMembers = data.max_members;

    /**
     * The max users to be in Stream mode
     * @type {number}
     */
    this.maxStreamUsers = data.max_video_channel_users;

    /**
     * The vanity code URL, `null` if **VANITY_URL** isn't a Feature of this [Guild]
     * @type {?string}
     */
    this.vanityCodeUrl = data.vanity_url_code;

    /**
     * The booster tier type of this guild
     * @type {?number}
     */
    this.boostTier = data.premium_tier;

    /**
     * The booster count of this guild
     * @type {number}
     */
    this.boosters = data.premium_subscription_count;

    /**
     * The sytem channel flags
     * @type {number}
     */
    this.systemChannelFlags = data.system_channel_flags;

    /**
     * The rules channel ID
     * @type {?string}
     */
    this.rulesChannelID = data.rules_channel_id;

    /**
     * The public updates channel ID
     * @type {?string}
     */
    this.publicUpdatesChannelID = data.public_updates_channel_id;

    /**
     * If embedding is enabled in this [Guild]
     * @type {boolean}
     */
    this.embedEnabled = data.embed_enabled;

    /**
     * The embed channel ID, returns `null` if the [Guild.embedEnabled] is false
     * @type {?string}
     */
    this.embedChannelID = data.embed_channel_id;

    /**
     * The guild's name
     * @type {string}
     */
    this.name = data.name;

    /**
     * Full member count
     * @type {number}
     */
    this.memberCount = data.member_count || this.memberCount;

    /**
     * The shard ID
     * @type {number}
     */
    this.shardID = data.shard_id || 0;

    if (data.emojis) {
      if (this.client.canCache('emoji')) {
        for (let i = 0; i < data.emojis.length; i++) {
          const emoji = data.emojis[i];
          this.emojis.set(emoji.id, new Emoji(this.client, { guild_id: this.id, ...emoji }));
        }
      }
    }

    if (data.roles) {
      if (this.client.canCache('member:role')) {
        for (let i = 0; i < data.roles.length; i++) {
          const role = data.roles[i];
          this.roles.set(role.id, new Role(this.client, { guild_id: this.id, ...role }));
        }
      }
    }

    if (data.channels) {
      if (this.client.canCache('channel')) {
        for (let i = 0; i < data.channels.length; i++) {
          const channel = data.channels[i];
          const type = BaseChannel.from(this.client, channel);

          this.channels.set(type.id, type);
          this.client.insert('channel', type); // insert if not in the cache
        }
      }
    }

    if (data.members) {
      if (this.client.canCache('member')) {
        for (let i = 0; i < data.members.length; i++) {
          const member = data.members[i];
          this.members.set(member.id, new Member(this.client, { guild_id: this.id, ...member }));
        }
      }
    }

    if (data.voice_states) {
      if (this.client.canCache('voice:state')) {
        for (let i = 0; i < data.voice_states.length; i++) {
          const state = data.voice_states[i];
          this.voiceStates.set(state.id, new VoiceState(this.client, state));
        }
      }
    }

    if (data.presences) {
      if (this.client.canCache('presence')) {
        for (let i = 0; i < data.presences.length; i++) {
          const presence = data.presences[i];
          this.presences.set(presence.user.id, new Presence(this.client, presence));
        }
      }
    }

    return this;
  }

  /**
   * Return the guild's [WebSocketShard]
   * @returns {import('../gateway/WebSocketShard') | null} The shard or `null` if not found
   */
  get shard() {
    return this.client.shards.get(this.shardID) || null;
  }

  /**
   * Returns the owner of this [Guild]
   * @returns {import('./User') | null}
   */
  get owner() {
    return this.client.users.get(this.ownerID) || null;
  }

  /**
   * Fetches the guild members and returns it, if any
   * @param {FetchGuildMembersOptions} opts The options
   * @arity Wumpcord.Entities.Guild.fetchMembers/1
   */
  async fetchMembers({ limit, presences, query, time, nonce, force, userIds } = {
    limit: this.maxMembers,
    presences: false,
    query: '',
    time: 120e3,
    nonce: Date.now().toString(16),
    force: false,
    userIds: []
  }) {
    return new Promise((resolve, reject) => {
      if (this.memberCount === this.members.size && !limit && !presences && !query && !userIds && !force) return resolve(this.members);

      if (nonce.length > 32) return reject(new RangeError('Nonce length was over 32.'));
      if (!this.shard) return reject(new Error(`Shard #${this.shardID} doesn't exist`));

      this.shard.send(OPCodes.GetGuildMembers, {
        guild_id: this.id,
        presences,
        user_ids: userIds,
        query: query || '',
        nonce,
        limit: limit || this.maxMembers
      });

      const guildMembers = this.client.canCache('member') ? new Collection() : null; // this gets merged
      const members = new Collection(); // this gets resolved
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        return reject(new Error(`Unable to fetch guild members in ${time}ms`));
      }, time);

      const handler = (all, _, chunk) => {
        timeout.refresh();
        if (chunk.nonce !== nonce) return;

        for (const member of all.values()) {
          if (this.client.canCache('member')) {
            members.set(member.user.id, member);
            guildMembers.set(member.user.id, new Member(this.client, { guild_id: this.id, ...member }));
          }
        }

        if (this.client.canCache('member')) {
          this.members = guildMembers;
        }

        if (limit && (members ? members.size >= limit : true)) {
          clearTimeout(timeout);
          this.client.remove('guildMemberChunk', handler);

          return resolve(members);
        }

        clearTimeout(timeout);
        this.client.remove('guildMemberChunk', handler);

        return resolve(members);
      };

      this.client.on('guildMemberChunk', handler);
    });
  }

  /**
   * Deletes this guild if this bot is the owner
   * @returns {Promise<boolean>} Truthy value if it deleted or not
   */
  delete() {
    if (this.ownerID !== this.client.user.id) throw new Error(`Bot isn't owner of ${this.toString()}`);

    return this.client.rest.dispatch({
      endpoint: Endpoints.guild(this.id),
      method: 'DELETE'
    }).then(() => true)
      .catch(() => false);
  }

  /**
   * Bans a member from this [Guild]
   * @param {string} userID The user's ID
   * @param {BanOptions} [opts] The options to use
   */
  ban(userID, opts = {}) {
    /** @type {BanOptions} */
    const options = Util.merge(opts, {
      days: 7
    });

    if (options.days > 7) throw new TypeError('Message deletion days must range from 0-7 (default: 7)');
    if (options.reason) {
      if (typeof options.reason !== 'string') throw new TypeError('`reason` has to be a string');
      if (options.reason === '') throw new TypeError('`reason` can\'t be an empty string');
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.ban(this.id, userID),
      method: 'PUT',
      data: {
        delete_message_days: options.days,
        reason: options.reason
      }
    })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Unbans a member from this [Guild]
   * @param {string} userID The user's ID
   */
  unban(userID) {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.ban(this.id, userID),
      method: 'DELETE'
    })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Creates a channel in Discord
   * @param {CreateChannelOptions} opts The channel options
   */
  createChannel(opts) {
    if (typeof opts === 'undefined' || typeof opts !== 'object') throw new TypeError('`opts` is not defiend or it\'s not an object');
    if (!opts.hasOwnProperty('name') || !opts.hasOwnProperty('type')) throw new TypeError('Missing `opts.name` and `opts.type` in Guild#createChannel');

    // type-checking for text channels
    if (opts.type === 0) {
      if (opts.topic) {
        if (typeof opts.topic !== 'string') throw new TypeError('`opts.topic` was not a string');
        if (opts.topic === '' || opts.topic < 2 || opts.topic > 1024) throw new TypeError('`opts.topic` is empty, or the length is under 2 / over 1024 chars');
      }

      if (opts.ratelimitPerUser) {
        if (typeof opts.ratelimitPerUser !== 'number') throw new TypeError('`opts.ratelimitPerUser` was not a number');
        if (Number.isNaN(opts.ratelimitPerUser)) throw new TypeError('`opts.ratelimitPerUser` was not a number');
        if (opts < 0 || opts > 21600) throw new TypeError('`opts.ratelimitPerUser` is under 0 / over 21600');
      }
    } else if (opts.type === 2) { // type checking for voice channels
      if (opts.bitrate) {
        if (typeof opts.bitrate !== 'number') throw new TypeError('`opts.bitrate` was not a number');
        if (Number.isNaN(opts.bitrate)) throw new TypeError('`opts.bitrate` was not a number');
        if (opts.bitrate < 8000 || opts.bitrate > 96000) throw new TypeError('`opts.bitrate` was under 8kbps / over 96kbps');
      }

      if (opts.userLimit) {
        if (typeof opts.userLimit !== 'number') throw new TypeError('`opts.userLimit` was not a number');
        if (Number.isNaN(opts.userLimit)) throw new TypeError('`opts.userLimit` was not a number');
        if (opts.userLimit < 0 || opts.userLimit > 100) throw new TypeError('`opts.userLimit` was under 0 / over 100 users');
      }
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.channels(this.id),
      method: 'POST',
      data: {
        name: opts.name,
        type: opts.type,
        topic: opts.topic,
        bitrate: opts.bitrate,
        user_limit: opts.userLimit,
        ratelimit_per_user: opts.ratelimitPerUser,
        position: opts.position,
        permission_overwrites: opts.permissionOverwrites,
        parent_id: opts.parentID,
        nsfw: opts.nsfw || false
      }
    }).then((data) => {
      console.log(require('util').inspect(data, { depth: 5 }));
      return true;
    }).catch(() => null);
  }

  toString() {
    return `[Guild "${this.name}" (${this.id})]`;
  }
};

/**
 * @typedef {object} FetchGuildMembersOptions
 * @prop {number} [limit=0] The limit
 * @prop {boolean} [presences=false] If we should include presences
 * @prop {any} [query] The query to use
 * @prop {number} [time=120e3] The time to conclude
 * @prop {string} [nonce] The nonce string
 * @prop {boolean} [force=false] If should be forceful or not
 * @prop {string[]} [userIds=[]] The user ID array
 *
 * @typedef {object} BanOptions
 * @prop {string} [reason=''] The reason to set in audit logs
 * @prop {number} [days=7] The amount of days to delete messages (max: 7, min: 0)
 *
 * @typedef {object} CreateChannelOptions
 * @prop {string} name The name of the channel
 * @prop {number} type The type to use
 * @prop {string} [topic=undefined] The topic, if it's a text channel
 * @prop {number} [bitrate=undefined] The bitrate of the voice channel
 * @prop {number} [userLimit=undefined] The user limit for a voice channel
 * @prop {number} [ratelimitPerUser=undefined] The number of seconds a user before have to send a message
 * @prop {number} [position=undefined] The position to set
 * @prop {Array<{ allow: number; deny: number; type: 'role' | 'member'; id: string }>} [permissionOverwrites=undefined] List of overwrites, must match the overwrite object
 * @prop {string} [parentID=undefined] The parent category's channel ID
 * @prop {boolean} [nsfw=false] If the channel is NSFW or not
 */
