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

const UnavailableGuild = require('./UnavailableGuild');
const { Collection } = require('@augu/immutable');
const { OPCodes } = require('../Constants');
const VoiceState = require('./VoiceState');
const BaseChannel = require('./BaseChannel');
const Presence = require('./Presence');
const Member = require('./GuildMember');
const Role = require('./Role');
const Emoji = require('./Emoji');

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
          this.presences.set(presence.id, new Presence(this.client, presence));
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
 */

/*
Guild {
  emojis: [
    {
      name: 'getaloadofthisguy',
      roles: [],
      id: '662923155119145001',
      require_colons: true,
      managed: false,
      animated: false,
      available: true
    }
  ],
  roles: [
    {
      id: '743698927039283201',
      name: '@everyone',
      permissions: 104320577,
      position: 0,
      color: 0,
      hoist: false,
      managed: false,
      mentionable: false,
      permissions_new: '104320577'
    }
  ]
}
*/
