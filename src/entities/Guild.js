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

const UnavailableGuild = require('./UnavailableGuild');
const { Collection }   = require('@augu/immutable');

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
     * The channels cache or a number representing the channel count
     * @type {Collection<import('./BaseChannel')> | number}
     */
    this.channels = client.canCache('channel') ? new Collection() : 0;

    /**
     * The members cache or a number representing the member count
     * @type {Collection<import('./GuildMember')> | number}
     */
    this.members = client.canCache('member') ? new Collection() : 0;

    /**
     * The role cache or a number representing the role count
     * @type {Collection<import('./Role')> | number}
     */
    this.roles = client.canCache('member:role') ? new Collection() : 0;

    /**
     * The emoji cache or a number representing the emoji count
     * @type {Collection<import('./Emoji')> | number}
     */
    this.emojis = client.canCache('emoji') ? new Collection() : 0;
    
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

    if (data.emojis) {
      if (this.client.canCache('emoji')) {
        for (let i = 0; i < data.emojis.length; i++) this.emojis.set(data.emojis[i].id, data.emojis[i]);
      } else {
        this.emojis = data.emojis.length;
      }
    }

    if (data.roles) {
      if (this.client.canCache('member:role')) {
        for (let i = 0; i < data.roles.length; i++) this.roles.set(data.roles[i].id, data.roles[i]);
      } else {
        this.roles = data.roles.length;
      }
    }
  }
};

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
