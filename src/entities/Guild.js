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

const { OPCodes, Endpoints, AuditLogActions } = require('../Constants');
const UnavailableGuild = require('./UnavailableGuild');
const { Collection } = require('@augu/immutable');
const VoiceState = require('./VoiceState');
const BaseChannel = require('./BaseChannel');
const Presence = require('./Presence');
const Member = require('./GuildMember');
const Role = require('./Role');
const Emoji = require('./Emoji');
const Util = require('../util/Util');
const VoiceRegion = require('./VoiceRegion');
const GuildMember = require('./GuildMember');
const GuildInvite = require('./GuildInvite');
const GuildBan = require('./misc/GuildBan');
const GuildPreview = require('./misc/GuildPreview');
const { toCamelCase } = require('../util/Util');
const AuditLogs = require('./misc/AuditLogs');
const DynamicWrapper = require('./wrappable/DynamicImage');
const NotImplementedError = require('../exceptions/NotImplementedError');
const Webhook = require('./Webhook');
const ChannelStore = require('../stores/ChannelStore');

/**
 * Represents a Discord guild
 */
class Guild extends UnavailableGuild {
  /**
   * Creates a new [Guild] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client
   * @param {GuildPacket} data The data to use
   */
  constructor(client, data) {
    super(data);

    /**
     * The channels cache or `null` if not cachable
     * @type {ChannelStore}
     */
    this.channels = new ChannelStore(client);

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
   * @param {import('discord-api-types/v8').APIGuild} data The data
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
     * The guild's name
     * @type {string}
     */
    this.name = data.name;

    /**
     * Full member count
     * @type {number}
     */
    this.memberCount = data.member_count || this.memberCount || 0;

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
      for (let i = 0; i < data.channels.length; i++) {
        const d = data.channels[i];
        const c = BaseChannel.from(this.client, { guild_id: this.id, ...d });

        this.client.channels.add(c);
        this.channels.add(c);
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
    if (!this.client.canCache('user')) return null;

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
    }).then(() => true);
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
      .then(() => true);
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
      .then(() => true);
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
    })
      .then(() => true);
  }

  /**
   * Returns the list of voice regions available for this [Guild]
   * @returns {Promise<VoiceRegion[]>} A list of regions available or an empty Array if a REST error occured
   */
  getRegions() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.voiceRegions(this.id),
      method: 'get'
    })
      .then((regions) => regions.map(region => new VoiceRegion(region)));
  }

  /**
   * Returns the lsit of the voice regions IDs available for this guild
   * @returns {Promise<string[]>} A list of region IDs available from this Guild or an empty Array if a REST error occured
   */
  getRegionIds() {
    return this.getRegions()
      .then(regions => regions.map(region => region.id));
  }

  /**
   * Gets the guild preview for Discovery, this is only for Public Guilds
   * @returns {Promise<GuildPreview>} Returns the guild preview or null if it's not a public guild
   */
  getPreview() {
    return this.client.rest.dispatch({
      endpoint: `/guilds/${this.id}/preview`,
      method: 'get'
    })
      .then((preview) => preview === null ? null : new GuildPreview(preview));
  }

  /**
   * Returns a list of guild channels available in this [Guild]
   * and possibly caches them
   *
   * @returns {Promise<import('./BaseChannel')[]>} Returns an Array of guild channels
   * or an empty Array if an REST error has occured
   */
  getChannels() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.channels(this.id),
      method: 'get'
    })
      .then((channels) => channels.map(channel => BaseChannel.from(this.client, channel)));
  }

  /**
   * Gets a guild member from this guild
   * @param {string} memberID The member's ID
   * @returns {Promise<GuildMember>} The member instance or `null` if a REST error occured
   */
  fetchMember(memberID) {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.member(this.id, memberID),
      method: 'GET'
    })
      .then((data) => new GuildMember(this.client, data));
  }

  /**
   * Modifies the guild's metadata and patches this [Guild] instance,
   * this will call the `guildUpdate` event if it's cachable by you.
   *
   * @param {EditGuildOptions} opts The options to use
   * @returns {Promise<this>} Returns this [Guild] instance that has
   * the patched updates or an error why it can't fulfill the request
   */
  async edit(opts) {
    if (!opts) throw new TypeError('Missing options object, refer to the documentation: https://docs.augu.dev/Wumpcord/Types/EditGuildOptions');
    if (!Object.keys(opts).length) throw new TypeError('Must include something to update');

    // Throw an error if this is a WIP
    if (opts.icon) throw new Error('This option isn\'t available in this context');
    const regions = await this.getRegionIds();

    // now it's time for checking the object for incoinsisent data
    // this is where the part I want to kill myself but hey
    // I like pain so like \o/
    if (opts.name && typeof opts.name !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof opts.name}`);
    if (opts.ownerID && typeof opts.ownerID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.ownerID}`);
    if (opts.afkChannelID && typeof opts.afkChannelID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.afkChannelID}`);
    if (opts.systemChannelID && typeof opts.systemChannelID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.systemChannelID}`);
    if (opts.afkChannelTimeout && (typeof opts.afkChannelTimeout !== 'number' || Number.isNaN(opts.afkChannelID))) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.afkChannelID}`);

    if (opts.splash) {
      if (!this.features.includes('INVITE_SPLASH')) throw new TypeError(`Guild "${this.name}" doesn't have the INVITE_SPLASH feature`);
      throw new TypeError('`splash` in `opts` is not available in this context.');
    }

    if (opts.banner) {
      if (!this.features.includes('BANNER')) throw new TypeError(`Guild "${this.name}" doesn't have the BANNER feature`);
      throw new TypeError('`banner` in `opts` is not available in this context.');
    }

    if (opts.region) {
      if (typeof opts.region !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof opts.region}`);
      if (!regions.includes(opts.region)) throw new TypeError(`Region "${opts.region}" wasn't a valid region (${ids.join(', ')})`);
    }

    if (opts.verificationLevel) {
      if (typeof opts.verificationLevel !== 'number' || Number.isNaN(opts.verificationLevel)) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.verificationLevel}`);
      if (opts.verificationLevel < 0) throw new TypeError('Verification Level must be higher or equal to 5');
      if (opts.verificationLevel > 5) throw new TypeError('Verification Level must be lower or equal to 5');
    }

    if (opts.defaultMessageNotifications) {
      if (typeof opts.defaultMessageNotifications !== 'number' || Number.isNaN(opts.defaultMessageNotifications)) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.defaultMessageNotifications}`);
      if (opts.defaultMessageNotifications < 0) throw new TypeError('Default Message Notifications must be higher or equal to 1');
      if (opts.defaultMessageNotifications > 1) throw new TypeError('Default Message Notifications must be lower or equal to 1');
    }

    if (opts.explicitContentFilter) {
      if (typeof opts.explicitContentFilter !== 'number' || Number.isNaN(opts.explicitContentFilter)) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.explicitContentFilter}`);
      if (opts.explicitContentFilter < 0) throw new TypeError('Explicit Content Filter must be higher or equal to 2');
      if (opts.explicitContentFilter > 2) throw new TypeError('Explicit Content Filter must be lower or equal to 2');
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.guild(this.id),
      method: 'patch',
      data: {
        default_message_notifications: opts.defaultMessageNotifications,
        explicit_content_filter: opts.explicit_content_filter,
        system_channel_id: opts.systemChannelID,
        afk_channel_id: opts.afkChannelID,
        afk_timeout: opts.afk_timeout,
        owner_id: opts.ownerID,
        region: opts.region,
        name: opts.name
      }
    })
      .then((data) => {
        this.patch(data);
        return this;
      });
  }

  /**
   * Modifies the guild channel's position
   * @param {string} id The channel's ID
   * @param {number} pos The position
   * @returns {Promise<boolean>} Boolean-represented value if it was a successful transaction
   * or not
   */
  async modifyChannelPosition(id, pos) {
    if (!id || !pos) throw new TypeError('Missing `id` or `pos` properties');
    if (typeof id !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof id}`);
    if (typeof pos !== 'number' || Number.isNaN(pos)) throw new TypeError(`Expected \`number\`, gotten ${typeof pos}`);

    const channels = await this.getChannels();
    const channel = channels.find(chan => chan.id === id);

    if (!channel || !['text', 'voice', 'category', 'news', 'store'].includes(channel.type)) throw new TypeError(`Channel "${id}" doesn't exist or the type isn't text, voice, category, news, or store`);
    if (channel.position === pos) return Promise.resolve();

    const min = Math.min(pos, channel.position);
    const max = Math.max(pos, channel.position);
    const sorted = channels.filter(chan =>
      chan.type === channel.type
        && min <= chan.position
        && chan.position <= max
        && chan.id !== id
    ).sort((chan1, chan2) => chan1.position - chan2.position);

    if (pos > channel.position) {
      sorted.push(channel);
    } else {
      sorted.unshift(channel);
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.channels(this.id),
      method: 'patch',
      data: sorted.map((channel, index) => ({
        position: index + min,
        id: channel.id
      }))
    })
      .then(() => true);
  }

  /**
   * Edits a certain guild member's data in the guild,
   * this is for compability only, use the specific functions
   * layouted in [GuildMember] (i.e: `GuildMember.nick/1`)
   *
   * @param {string} memberID The member ID
   * @param {EditGuildMemberOptions} opts The options to update the guild member
   * @returns {Promise<GuildMember>} Returns the guild member's patched data
   * or an error thrown for valdiation/REST-related errors
   */
  async editMember(memberID, opts) {
    /** @type {GuildMember} */
    let member;
    if (!this.members || !this.members.has(memberID)) {
      member = await this.fetchMember(memberID);
    } else {
      member = this.members.get(memberID);
    }

    if (member === undefined || member === null) throw new TypeError(`Member "${memberID}" doesn't exist in guild "${this.toString()}"`);

    // now time to type check owo
    if (opts.nick && typeof opts.nick !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.nick}`);
    if (opts.mute && typeof opts.mute !== 'boolean') throw new TypeError(`Expected \`boolean\`, but gotten ${typeof opts.mute}`);
    if (opts.deaf && typeof opts.deaf !== 'boolean') throw new TypeError(`Expected \`boolean\`, but gotten ${typeof opts.deaf}`);
    if (opts.roles) {
      if (!Array.isArray(opts.roles)) throw new TypeError(`Expected \`array\`, but gotten ${typeof opts.roles}`);
      if (opts.roles.some(roleID => typeof roleID !== 'string')) {
        const roles = opts.roles.filter(roleID => typeof roleID !== 'string');
        throw new TypeError(`${roles.length} roles were not a string`);
      }
    }

    if (opts.channelID && typeof opts.channelID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.channelID}`);

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.member(this.id, member.id),
      method: 'PATCH',
      data: {
        channel_id: opts.channelID,
        roles: opts.roles,
        mute: opts.mute,
        deaf: opts.deaf,
        nick: opts.nick
      }
    });
  }

  /**
   * Adds a role to a guild member, use `GuildMember.addRole/1`
   * for more of an easier way
   *
   * @param {string} memberID The member's ID
   * @param {string} roleID The role's ID
   * @returns {Promise<boolean>} Boolean-represented value
   * if it was a success or not
   */
  async addRole(memberID, roleID) {
    /** @type {GuildMember} */
    let member;

    /** @type {Role} */
    let role;

    if (!this.members || !this.members.has(memberID)) {
      member = await this.fetchMember(memberID);
    } else {
      member = this.members.get(memberID);
    }

    if (!this.roles || !this.roles.has(roleID)) {
      role = await this.fetchRole(roleID);
    } else {
      role = this.roles.get(roleID);
    }

    if (!member) throw new TypeError(`Member "${memberID}" was not found in this guild`);
    if (!role) throw new TypeError(`Role "${roleID}" doesn't exist in this guild`);

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.memberRole(this.id, member.id, role.id),
      method: 'PUT'
    })
      .then(() => true);
  }

  /**
   * Removes a role to a guild member, use `GuildMember.removeRole/1`
   * for more of an easier way
   *
   * @param {string} memberID The member's ID
   * @param {string} roleID The role's ID
   * @returns {Promise<boolean>} Boolean-represented value
   * if it was a success or not
   */
  async removeRole(memberID, roleID) {
    /** @type {GuildMember} */
    let member;

    /** @type {Role} */
    let role;

    if (!this.members || !this.members.has(memberID)) {
      member = await this.fetchMember(memberID);
    } else {
      member = this.members.get(memberID);
    }

    if (!this.roles || !this.roles.has(roleID)) {
      role = await this.fetchRole(roleID);
    } else {
      role = this.roles.get(roleID);
    }

    if (!member) throw new TypeError(`Member "${memberID}" was not found in this guild`);
    if (!role) throw new TypeError(`Role "${roleID}" doesn't exist in this guild`);

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.memberRole(this.id, member.id, role.id),
      method: 'DELETE'
    })
      .then(() => true);
  }

  /**
   * Kicks a member from the guild, use `GuildMember.kick/0`
   * for more of an easier way
   *
   * @param {string} memberID The member's ID
   * @returns {Promise<boolean>} Boolean-represented value
   * if they were kicked or not
   */
  async kickMember(memberID) {
    /** @type {GuildMember} */
    let member;
    if (!this.members || !this.members.has(memberID)) {
      member = await this.fetchMember(memberID);
    } else {
      member = this.members.get(memberID);
    }

    if (member === undefined || member === null) throw new TypeError(`Member "${memberID}" doesn't exist in guild "${this.toString()}"`);
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.member(this.id, member.id),
      method: 'DELETE'
    })
      .then(() => true);
  }

  /**
   * Gets the list of bans available for this [Guild]
   * @returns {Promise<GuildBan[]>} Returns a list of guild bans available
   */
  getBans() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.bans(this.id),
      method: 'GET'
    })
      .then((bans) => bans.map(ban => new GuildBan(client, { guild_id: this.id, ...ban })));
  }

  /**
   * Gets a list of roles and possibly caches them
   * @returns {Promise<Role[]>} Returns an Array of roles or an
   * empty array of roles if an REST error occured
   */
  getRoles() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.roles(this.id),
      method: 'GET'
    })
      .then((roles) => roles.map(role => new Role(this.client, role)));
  }

  /**
   * Creates a role for the guild and possibly caches it,
   * the `guildRoleCreate` event is emitted when you call this function
   * with success. Use `Role.create/1` to create this role for an
   * easier option.
   *
   * @param {CreateRoleOptions} opts The options to create the role
   * @returns {Promise<Role>} Returns the newly created
   */
  createRole(opts) {
    if (!opts) throw new TypeError('Missing `opts` object');
    if (typeof opts !== 'object' && !Array.isArray(opts)) return new TypeError(`Expected \`object\`, but received ${typeof opts}`);

    if (opts.name && typeof opts.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof opts.name}`);
    if (opts.color && (typeof opts.color !== 'number' || typeof opts.color !== 'string')) throw new TypeError(`Expected \`string\` or \`number\`, but received ${typeof opts.color}`);
    if (opts.hoistable && typeof opts.hoistable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.hoistable}`);
    if (opts.mentionable && typeof opts.mentionable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.mentionable}`);
    if (opts.permissions && typeof opts.permissions !== 'number') throw new TypeError(`Expected \`number\`, but recieved ${typeof opts.permissions}`);

    let color;
    if (opts.color) {
      if (typeof opts.color === 'string') {
        color = parseInt(opts.color.replace('#', ''), 16);
      } else {
        color = opts.color;
      }
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.roles(this.id),
      method: 'PUT',
      data: {
        mentionable: opts.mentionable,
        permissions: String(opts.permissions),
        color,
        hoist: opts.hoistable,
        name: opts.name
      }
    })
      .then((role) => {
        if (this.client.canCache('member:role')) this.roles.set(role.id, new Role(this.client, role));
        return new Role(this.client, role);
      });
  }

  /**
   * Deletes the role from the guild and removes it from cache;
   * if cached. Event `guildRoleDelete` is emitted when you
   * call this function with success. Use `Role.delete/0` to
   * delete this role for an easier option
   *
   * @param {string} roleID The role's ID
   */
  async deleteRole(roleID) {
    const roles = await this.getRoles();
    const found = roles.find(role => role.id === roleID);

    if (!found) throw new TypeError(`Role "${roleID}" was not found in the guild`);
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.role(this.id, found.id),
      method: 'DELETE'
    })
      .then(() => true);
  }

  /**
   * Modifies the role in this guild, to modify the
   * role's position, use `Guild.modifyRolePosition` or `Role.modifyPosition`
   * for an easier option. This function emits the `guildRoleUpdate` event
   * when modified successfully. For an easier option, call `Role.modify`
   * to modify it without providing a role ID
   *
   * @param {string} roleID The role to modify
   * @param {EditGuildRoleOptions} opts The options to use to modify it
   * @returns {Promise<Role>} The modified role or an error
   * called when a validation/REST-related error occurs
   */
  async modifyRole(roleID, opts) {
    const roles = await this.getRoles();
    const role = roles.find(role => role.id === roleID);

    if (!role) throw new TypeError(`Role with ID "${roleID}" was not found`);
    if (!opts) throw new TypeError('Missing `opts` object');
    if (typeof opts !== 'object' && !Array.isArray(opts)) throw new TypeError(`Expected \`object\`, received ${typeof opts}`);

    if (opts.name && typeof opts.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof opts.name}`);
    if (opts.color && (typeof opts.color !== 'number' || typeof opts.color !== 'string')) throw new TypeError(`Expected \`string\` or \`number\`, but received ${typeof opts.color}`);
    if (opts.hoistable && typeof opts.hoistable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.hoistable}`);
    if (opts.mentionable && typeof opts.mentionable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.mentionable}`);
    if (opts.permissions && typeof opts.permissions !== 'number') throw new TypeError(`Expected \`number\`, but recieved ${typeof opts.permissions}`);

    let color;
    if (opts.color) {
      if (typeof opts.color === 'string') {
        color = parseInt(opts.color.replace('#', ''), 16);
      } else {
        color = opts.color;
      }
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.role(this.id, role.id),
      method: 'PATCH',
      data: {
        mentionable: opts.mentionable,
        permissions: String(opts.permissions),
        color,
        hoist: opts.hoistable,
        name: opts.name
      }
    })
      .then(() => true);
  }

  /**
   * Modifies the role's position in this guild, use `Role.modifyPosition`
   * for an easier option. This function emits the `guildRoleUpdate` event
   * when modified successfully.
   *
   * @param {string} roleID The role's ID
   * @param {number} pos The role's position
   * @returns {Promise<boolean>} If the role was updated
   * successfully or not, the role will be updated in cache in realtime.
   */
  async modifyRolePosition(roleID, pos) {
    const roles = await this.getRoles();
    const role = roles.find(role => role.id === roleID);

    if (!role) throw new TypeError(`Role with ID "${roleID}" was not found`);
    if (role.position === pos) return Promise.resolve();

    const min = Math.min(pos, role.position);
    const max = Math.max(pos, role.position);
    const sorted = roles.filter(role =>
      min <= role.position &&
      role.position <= max &&
      role.id !== roleID
    ).sort((role1, role2) => role1.position - role2.position);

    if (pos > role.position) {
      sorted.push(role);
    } else {
      sorted.unshift(role);
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.roles(this.id),
      method: 'PATCH',
      data: sorted.map((role, idx) => ({
        position: idx + min,
        id: role.id
      }))
    })
      .then(() => true);
  }

  /**
   * Prunes members who has been inactive by it's `days` option,
   * this function fires multiple `guildMemberRemove` events at
   * a time, so be careful of rate-limiting if implementing
   * a "Member has been removed!" system.
   *
   * @param {GuildPruneOptions} opts The options to use
   * @returns {Promise<void>} Returns an empty promise
   * or an error thrown if a REST error occurs
   */
  prune(opts) {
    const options = Util.merge(opts, { days: 7 });

    if (options.computed && typeof options.computed !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof options.computed}`);
    if (options.roles) {
      if (!Array.isArray(options.roles)) throw new TypeError(`Expected \`array\`, but received ${typeof options.roles}`);
      if (options.roles.some(role => typeof role !== 'string')) {
        const roles = options.roles.filter(role => typeof role !== 'string');
        throw new TypeError(`${roles.length} roles weren't a string`);
      }
    }

    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.prune(this.id),
      method: 'POST',
      data: {
        computed_prune_count: options.computed,
        roles: options.roles,
        days: options.days
      }
    });
  }

  /**
   * Retrives a list of invites created by users
   * @returns {Promise<GuildInvite[]>} Returns an Array of guild invites
   * available or an empty Array if a REST error occurs
   */
  getInvites() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.invites(this.id),
      method: 'GET'
    })
      .then((invites) => invites.map(invite => new GuildInvite(this.client, invite)));
  }

  /**
   * Fetches the audit log list from this [Guild],
   * this function requires the bot to have **View Audit Logs** permission,
   * so beware of permission checks before running this function.
   *
   * @param {FetchAuditLogsOptions} opts The options to use
   * @returns {Promise<AuditLogs[]>} Returns an Array of audit log entries
   * or an empty Array if a REST error occured
   */
  getAuditLogs(opts = { limit: 50 }) {
    if (opts && typeof opts !== 'object') throw new TypeError(`Expected \`object\`, but received ${typeof opts}`);
    if (opts.actionType) {
      if (typeof opts.actionType !== 'number' || typeof opts.actionType !== 'string') throw new TypeError(`Expected \`number\`, but received ${typeof opts.actionType}`);

      const types = Object.keys(toCamelCase(AuditLogActions));
      if (typeof opts.actionType === 'string' && !types.includes(opts.actionType)) throw new TypeError(`Unknown action to fetch from "${opts.actionType}"`);

      const int = Number(opts.actionType);
      if (isNaN(int)) throw new TypeError(`"${opts.actionType}" was not a number`);

      const values = Object.values(AuditLogActions);
      if (!values.includes(opts.actionType)) throw new TypeError(`Audit log action "${opts.actionType}" doesn't exist, refer `);
    }

    if (opts.limit) {
      if (typeof opts.limit !== 'number') throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.limit}`);

      const int = Number(opts.limit);
      if (isNaN(int)) throw new TypeError(`"${opts.limit}" was not a number`);

      if (int < 0 || int > 100) throw new TypeError(`"${int}" can't go <0 or >50`);
    }

    if (opts.before && typeof opts.before !== 'string') throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.before}`);

    const url = Util.getAuditLogUrl(this.id, opts);
    return this.client.rest.dispatch({
      endpoint: url,
      method: 'GET'
    })
      .then((logs) => new AuditLogs(this.client, logs));
  }

  /**
   * Fetches a list of emojis from the server
   * @returns {Promise<Emoji[]>} Returns an Array of emojis to use
   * and possibly caches them if needed.
   */
  getEmojis() {
    return this.client.rest.dispatch({
      endpoint: Endpoints.Guild.emojis(this.id),
      method: 'GET'
    })
      .then(data => {
        const all = data.map(emote => new Emoji(this.client, { guild_id: this.id, ...emote }));
        if (this.client.canCache('emoji')) {
          for (let i = 0; i < all.length; i++) this.emojis.set(all[i].id, all[i]);
        }

        return all;
      });
  }

  /**
   * Creates an emoji in the server, this will emit the `guildEmojisUpdate`
   * event when called successfully.
   *
   * @param {CreateEmojiOptions} options The options to use
   */
  createEmoji(options) {
    throw new NotImplementedError('Guild', 'createEmoji');
  }

  /**
   * Retrives an emoji from this Guild
   * @param {string} id The emoji's ID
   * @returns {Promise<Emoji>} The emoji or an
   * REST error if anything occurs
   */
  getEmoji(id) {
    return this.client.rest.dispatch({
      endpoint: `/guilds/${this.id}/emojis/${id}`,
      method: 'get'
    }).then(data => new Emoji(this.client, { guild_id: this.id, ...data }));
  }

  /**
   * Modifies an emoji from this Guild, when this
   * function is called successfully, the `guildEmojisUpdate`
   * event will emit.
   *
   * @param {ModifyEmojiOptions} options The options to use
   * to modify the emoji.
   * @returns {Promise<Emoji>} Returns the newly updated
   * emoji and possibly caches it.
   */
  modifyEmoji(options) {
    if (!options) throw new TypeError('Missing `options` object');
    if (typeof options !== 'object' && !Array.isArray(options)) throw new TypeError(`Expecting \`object\`, but received ${typeof options === 'object' ? 'array' : options}`);
    if (!options.id) throw new TypeError('Missing the emoji\'s ID. (https://docs.augu.dev/wumpcord/types#modify-emoji)');
    if (Object.keys(options).length === 0) throw new TypeError('No keys were provided to modify an emoji.');
    if (typeof options.id !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof options.id}`);
    if (options.name && typeof options.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.name}`);
    if (options.roles && !Array.isArray(options.roles)) throw new TypeError(`Expected \`array\`, but received ${typeof options.roles}`);

    return this.client.rest.dispatch({
      endpoint: `/guilds/${this.id}/emojis/${options.id}`,
      method: 'PATCH',
      data: {
        roles: options.roles,
        name: options.name
      }
    }).then(data => {
      const emoji = new Emoji(this.client, { guild_id: this.id, ...data });
      if (this.client.canCache('emoji')) this.emojis.set(emoji.id, emoji);

      return emoji;
    });
  }

  /**
   * Deletes an emoji from the [Guild], when this
   * function is called successfully, the `guildEmojisUpdate`
   * event will emit.
   * @param {string} id The emoji's ID
   */
  deleteEmoji(id) {
    return this.client.rest.dispatch({
      endpoint: `/guilds/${this.id}/emojis/${id}`,
      method: 'DELETE'
    }).then(() => {}); // eslint-disable-line
  }

  /**
   * Returns all the webhooks created in every guild channel
   * @returns {Promise<Webhook[]>}
   */
  getWebhooks() {
    return this.client.rest.dispatch({
      endpoint: `/guilds/${this.id}/webhooks`,
      method: 'get'
    }).then(data => data.map(d => new Webhook(this.client, d)));
  }

  toString() {
    return `[Guild "${this.name}" (${this.id})]`;
  }
}

DynamicWrapper.decorate(Guild, ['icon', 'banner', 'splash']);
module.exports = Guild;

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
 *
 * @typedef {object} EditGuildOptions
 * @prop {string} name
 * @prop {string} [icon]
 * @prop {string} [ownerID]
 * @prop {string} [afkChannelID]
 * @prop {number} [afkChannelTimeout]
 * @prop {string} [systemChannelID]
 * @prop {string} [splash]
 * @prop {string} [banner]
 * @prop {string} [region]
 * @prop {number} [verificationLevel]
 * @prop {number} [defaultMessageNotifications]
 * @prop {number} [explicitContentFilter]
 *
 * @typedef {object} EditGuildMemberOptions
 * @prop {string} [nick]
 * @prop {boolean} [mute]
 * @prop {boolean} [deaf]
 * @prop {string[]} [roles]
 * @prop {string} [channelID]
 *
 * @typedef {object} CreateRoleOptions
 * @prop {string} [name]
 * @prop {string | number} [color]
 * @prop {boolean} [hoistable]
 * @prop {boolean} [mentionable]
 * @prop {number} [permissions]
 *
 * @typedef {CreateRoleOptions} EditGuildRoleOptions
 *
 * @typedef {object} GuildPruneOptions
 * @prop {number} [days]
 * @prop {string[]} [roles]
 * @prop {boolean} [computed]
 *
 * @typedef {object} FetchAuditLogsOptions
 * @prop {number} [limit]
 * @prop {string} [before]
 * @prop {number | string} [actionType]
 *
 * @typedef {object} CreateEmojiOptions
 * @prop {string[]} roles
 * @prop {any} image
 * @prop {string} name
 *
 * @typedef {object} ModifyEmojiOptions
 * @prop {string[]} [roles]
 * @prop {string} [name]
 * @prop {string} id
 */
