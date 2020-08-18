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

const { GuildBoostTier } = require('../util/Constants');
const { Collection } = require('@augu/immutable');
const { Endpoints } = require('../util/Constants');
const GuildChannel = require('./channel/GuildChannel');
const GuildMember = require('./GuildMember');
const BaseEntity = require('./BaseEntity');
const VoiceState = require('./VoiceState');
const Emoji = require('./Emoji');
const Role = require('./Role');

module.exports = class BaseGuild extends BaseEntity {
  /**
   * Creates a new [BaseGuild]
   * @param {import('../Client')} client The client
   * @param {GuildPacket} data The data
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client instance
     * @type {import('../Client')}
     */
    this._client = client;

    /**
     * The roles cache
     * @type {Collection<import('./Role')> | number}
     */
    this.roles = client.canCache('role') ? new Collection() : 0;

    /**
     * The channels cache
     * @type {Collection<import('./GuildChannel')> | number}
     */
    this.channels = client.canCache('channel') ? new Collection() : 0;

    /**
     * The member cache
     * @type {Collection<import('./GuildMember')> | number}
     */
    this.members = client.canCache('member') ? new Collection() : 0;

    /**
     * Presence cache
     * @type {Collection<import('./Presence')> | number}
     */
    this.presences = client.canCache('presence') ? new Collection() : 0;

    /**
     * Emoji cache
     * @type {Collection<import('./Emoji')> | number}
     */
    this.emojis = client.canCache('emoji') ? new Collection() : 0;

    /**
     * The shard the guild belongs to
     * @type {import('../gateway/WebSocketShard').Shard}
     */
    this.shard = this.client.shards.get(data.shardID);

    if (data.unavaliable) {
      /**
       * If the guild is unavaliable
       * @type {boolean}
       */
      this.unavaliable = true;
    } else {
      this.patch(data);
    }
  }

  /**
   * Patches this guild
   * @param {GuildPacket} packet The packet
   */
  patch(packet) {
    /**
     * The name of the guild
     * @type {string}
     */
    this.name = packet.name;

    /**
     * The guild's icon
     * @type {string?}
     */
    this.icon = packet.icon;

    /**
     * The tier type of the guild
     * @type {'None' | 'Tier1' | 'Tier2' | 'Tier3'}
     */
    this.premiumTier = GuildBoostTier[packet.premium_tier];

    /**
     * Determines if the guild is large or not
     * @type {boolean}
     */
    this.large = Boolean(packet.hasOwnProperty('large') ? packet.large : this.large);

    /**
     * Array of all the guild's features
     * @type {Feature[]}
     */
    this.features = packet.features;

    /**
     * The member count of this guild
     * @type {number}
     */
    this.memberCount = packet.max_members || this.memberCount;

    /**
     * The splash UUID
     * @type {string}
     */
    this.splash = packet.splash;

    /**
     * The discovery splash UUIC
     */
    this.discoverySplash = packet.discovery_splash;

    /**
     * The guild's current region
     * @type {Region}
     */
    this.region = packet.region;

    /**
     * The notification type of this guild
     * @type {'none' | 'mentions'}
     */
    this.messageNotificationType = MessageNotificationType[packet.default_message_notifications];

    /**
     * The content filter type
     * @type {'disabled' | 'without_roles' | 'all'}
     */
    this.explicitContentFilter = ExplicitContentFilterLevel[packet.explicit_content_filter];

    /**
     * The guild's description
     * @type {string}
     */
    this.description = packet.description;

    /**
     * The vanity URL
     * @type {string?}
     */
    this.vanity = packet.vanity_url_code;

    if (packet.channels.length) {
      if (typeof this.channels === 'number') {
        this.channels = packet.channels.length;
      } else {
        this.channels.clear();
        for (const pkt of packet.channels) {
          this.channels.set(pkt.id, new GuildChannel(this._client, pkt));
        }
      }
    }

    if (packet.members.length) {
      if (typeof this.members === 'number') {
        this.members = packet.members.length;
      } else {
        this.members.clear();
        for (const member of packet.members) this.members.set(member.id, new GuildMember(this._client, member));
      }
    }

    if (packet.roles.length) {
      if (typeof this.roles === 'number') {
        this.roles = packet.roles.length;
      } else {
        this.roles.clear();
        for (const role of packet.roles) this.roles.set(role.id, new Role(this._client, role));
      }
    }

    if (packet.emojis.length) {
      if (typeof this.emojis === 'number') {
        this.emojis = packet.emojis.length;
      } else {
        this.emojis.clear();
        for (const emoji of packet.emojis) this.emojis.set(emoji.id, new Emoji(this._client, emoji));
      }
    }
  }

  /**
   * Fetches new data from this guild
   * @returns {Promise<this>} Returns this instance with new updated stuff
   */
  fetch() {
    return this._client.rest.dispatch({
      endpoint: Endpoints.guild(this.id),
      method: 'GET'
    }).then((data) => {
      this.patch(data);
      return this;
    });
  }

  /**
   * Gets the banner URL
   * @param {'png' | 'jpeg' | 'jpg' | 'gif' | 'webp'} [format='png'] The format
   * @param {number} [size=1024] The size
   */
  getBannerUrl(format = 'png', size = 1024) {
    if (!this.banner) return undefined;
    return Endpoints.CDN.getGuildBanner(this.id, this.banner, format, size);
  }
};

/**
 * @typedef {object} GuildPacket
 * @prop {number} default_message_notifications
 * @prop {number} [approximate_presence_count]
 * @prop {number} [approximate_member_count]
 * @prop {number} explicit_content_filter
 * @prop {number} verification_level
 * @prop {string} vanity_url_code
 * @prop {number} [max_presences]
 * @prop {number} [max_members]
 * @prop {number} premium_tier
 * @prop {boolean} unavaliable
 * @prop {number} afk_timeout
 * @prop {string} description
 * @prop {number} mfa_level
 * @prop {Feature[]} features
 * @prop {string} owner_id
 * @prop {import('./channel/GuildChannel').GuildChannelPacket[]} channels
 * @prop {string} [splash]
 * @prop {import('./GuildMember').GuildMemberPacket[]} members
 * @prop {import('./Emoji').EmojiPacket[]} emojis
 * @prop {Region} region
 * @prop {string} banner
 * @prop {boolean} large
 * @prop {import('./Role').RolePacket[]} roles
 * @prop {string} [icon]
 * @prop {string} name
 * @prop {string} id
 * 
 * @typedef {'INVITE_SPLASH' | 'VIP_REGIONS' | 'VANITY_URL' | 'VERIFIED' | 'PARTNERED' | 'PUBLIC' | 'COMMENCE' | 'NEWS' | 'DISCOVERABLE' | 'FEATURABLE' | 'ANIMATED_ICON' | 'BANNER'} Feature
 * @typedef {'brazil' | 'europe' | 'hong-kong' | 'india' | 'japan' | 'russia' | 'signapore' | 'south-africa' | 'sydney' | 'us-central' | 'us-east' | 'us-south' | 'us-west' | 'eu-central' | 'eu-west' | 'amsterdam' | 'frankfurt' | 'london' | 'dubai' | 'south-korea' | 'vip-amsterdam' | 'vip-brazil' | 'vip-eu-central' | 'vip-eu-west' | 'vip-frankfurt' | 'vip-london' | 'vip-japan' | 'vip-singapore' | 'vip-southafrica' | 'vip-sydney' | 'vip-us-central' | 'vip-us-east' | 'vip-us-south' | 'vip-us-west'} Region
 */