/**
 * Copyright (c) 2020-2021 August
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

import type { APIStageInstance } from '..';
import { WebSocketClient } from '../Client';
import { GuildFeature } from '../Constants';
import { ChannelStore } from '../stores/ChannelStore';
import { GuildEmojiStore } from '../stores/GuildEmojiStore';
import { GuildMemberStore } from '../stores/GuildMemberStore';
import { GuildPresenceStore } from '../stores/GuildPresenceStore';
import { GuildRoleStore } from '../stores/GuildRoleStore';
import { GuildVoiceStateStore } from '../stores/GuildVoiceStateStore';
import { BaseEntity } from './BaseEntity';
import { DynamicImage } from './inheritable/DynamicImage';
import { StageInstance } from './StageInstance';

import type {
  APIGuild as _APIGuild,
  APIGuildWelcomeScreen
} from 'discord-api-types';
import { VoiceState } from './VoiceState';
import { Channel } from './Channel';
import { Presence } from './Presence';
import { Member } from './Member';
import { Emoji } from './Emoji';
import { Role } from './Role';

/**
 * https://discord.com/developers/docs/resources/guild
 */
export interface APIGuild extends _APIGuild {
  /**
   * Array of stage instance objects in this guild
   */
  stage_instances?: APIStageInstance[];

  /**
   * The guild's NSFW level
   */
  nsfw_level: string;

  /**
   * The shard ID this guild belongs to
   */
  shard_id: number;
}

/*
interface PartialPermissionOverwrite {
  allow: string;
  deny: string;
  type: 'role' | 'member';
  id: string;
}

interface FetchGuildMembersOptions {
  presences?: boolean;
  limit?: number;
  query?: any;
  nonce?: string;
  force?: boolean;
  time?: number;
  ids?: string[];
}

export interface GuildBanOptions {
  reason?: string;
  days?: number;
}

interface CreateChannelOptions {
  permissionOverwrites?: PartialPermissionOverwrite[];
  ratelimitPerUser?: number;
  userLimit?: number;
  parentID?: string;
  position?: number;
  bitrate?: number;
  topic?: string;
  nsfw?: boolean;
  type: number;
  name: string;
}

interface ModifyGuildOptions {
  defaultMessageNotifications?: number;
  explicitContentFilter?: number;
  verificationLevel?: number;
  afkChannelTimeout?: number;
  systemChannelID?: string;
  afkChannelID?: string;
  ownerID?: string;
  splash?: string;
  banner?: string;
  region?: string;
  icon?: string;
  name?: string;
}

export interface ModifyGuildMemberOptions {
  channelID?: string;
  roles?: string[];
  deaf?: boolean;
  mute?: boolean;
  nick?: string;
}

interface CreateRoleOptions {
  permissions?: number;
  mentionable?: boolean;
  hoistable?: boolean;
  color?: string | number;
  name?: string;
}

interface GuildPruneOptions {
  computed?: boolean;
  roles?: string[];
  days?: number;
}

interface FetchAuditLogsOptions {
  actionType?: number;
  before?: string;
  limit?: number;
}

interface CreateEmojiOptions {
  roles?: string[];
  image: ImageData;
  name: string;
}

interface ModifyEmojiOptions {
  roles?: string[];
  name?: string;
  id: string;
}

interface ImageData {
  content: Buffer | Readable;
  type?: 'jpg' | 'png' | 'gif';
}

type EditGuildRoleOptions = CreateRoleOptions;

interface CreateGuildIntegrationOptions {
  type: GuildIntegration['type'];
  id: string;
}

interface ModifyGuildIntegrationOptions {
  expireGracePeriod?: number;
  expireBehaviour?: number;
  emojis?: boolean;
}
*/

/**
 * https://discord.com/developers/docs/resources/guild
 */
class Guild extends BaseEntity<APIGuild> {
  // Properties that are added when constructing FIRST
  /**
   * List of guild voice states available (requires the `GUILD_VOICE_STATES` intent to be available)
   */
  public voiceStates: GuildVoiceStateStore;

  /**
   * If the guild is unavailable (if this is `true`, you would have a [[UnavailableGuild]], not this.)
   */
  public unavailable: false;

  /**
   * List of guild presences available (requires the `GUILD_PRESENCES` intent to be available)
   */
  public presences: GuildPresenceStore;

  /**
   * List of guild channels available
   */
  public channels: ChannelStore;

  /**
   * List of guild members available (requires the `GUILD_MEMBERS` intent to be available)
   */
  public members: GuildMemberStore;

  /**
   * The client connection attached to this guild
   */
  public client: WebSocketClient;

  /**
   * List of guild emojis available
   */
  public emojis: GuildEmojiStore;

  /**
   * List of guild roles available
   */
  public roles: GuildRoleStore;

  // Properties added using Guild.patch
  /**
   * The default message notifications for this guild
   */
  public defaultMessageNotifications!: number;

  /**
   * The approximate presences (online users) available.
   *
   * @note This is returned in `Client.getGuild(withCounts)` with `withCounts` being set to true. This is never
   * constructed when `GUILD_CREATE` events happen.
   */
  public approximatePresenceCount?: number;

  /**
   * The approximate members available.
   *
   * @note
   * This is returned in `Client.getGuild(withCounts)` with `withCounts` being set to true. This is never
   * constructed when `GUILD_CREATE` events happen.
   */
  public approximateMemberCount?: number;

  /**
   * The ID of the channel where admins or moderators of Community guilds receive notices from Discord
   */
  public publicUpdatesChannelID?: string | null;

  /**
   * The filter level to show explicit content
   */
  public explicitContentFilter!: number;

  /**
   * Integer of the maximum amount of users in a video channel
   */
  public maxVideoChannelUsers?: number;

  /**
   * Bitfield of the flags for the system channel.
   */
  public systemChannelFlags!: number;

  /**
   * The verification level when members join.
   */
  public verificationLevel!: number;

  /**
   * The ID of the channel where guild notices such as
   * welcome messages or boost events are posted in
   */
  public systemChannelID!: string | null;

  /**
   * The channel ID that the widget will generate
   * an invite to, or `null` if set to no invite.
   */
  public widgetChannelID?: string | null;

  /**
   * Discovery splash hash; it is only present in guilds with the `"DISCOVERABLE"` feature.
   */
  public discoverySplash!: string | null;

  /**
   * The preferred language in the guild, defaults to `"en-US"`
   */
  public preferredLocale!: string;

  /**
   * List of stage instances available in this guild
   */
  public stageInstances?: StageInstance[];

  /**
   * Channel ID of where the rules are posted in
   */
  public rulesChannelID!: string | null;

  /**
   * The welcome screen of a Community guild, shown to new members, returned in an Invite's guild object
   */
  public welcomeScreen?: APIGuildWelcomeScreen;

  /**
   * The application ID of the guild creator if it is bot-created
   */
  public applicationID!: string | null;

  /**
   * `true` if the server widget is enabled
   */
  public widgetEnabled?: boolean;

  /**
   * The vanity URL code for this guild
   */
  public vanityURLCode!: string | null;

  /**
   * Snowflake of the AFK channel, if present.
   */
  public afkChannelID!: string | null;

  /**
   * The maximum number of presences for the guild (default value being 25000, is in effect when `null` is returned)
   */
  public maxPresences?: number | null;

  /**
   * Total number of members in this guild
   */
  public memberCount!: number;

  /**
   * The premium tier or server boost level
   */
  public premiumTier!: number;

  /**
   * The description of a Community guild
   */
  public description!: string | null;

  /**
   * Integer of the AFK timeout in seconds
   */
  public afkTimeout!: number;

  /**
   * The maxmium number of members for the guild
   */
  public maxMembers?: number;

  /**
   * The guild's NSFW level
   */
  public nsfwLevel!: number;

  /**
   * The number of boosts this guild current has, returns `undefined` if no one
   * is boosting.
   */
  public boosters?: number;

  /**
   * Array of guild features that is enabled
   */
  public features!: GuildFeature[];

  /**
   * The icon has, returned when in the template object
   */
  public iconHash!: string | null;

  /**
   * Required MFA (multi-factor authenication) level for this guild
   */
  public mfaLevel!: number;

  /**
   * ISO8601-formatted timestamp when this guild was joined at
   */
  public joinedAt?: Date;

  /**
   * List of threads in the guild, returns as [[ThreadChannel]]\(s).
   */
  public threads?: any[];

  /**
   * The shard ID this guild belongs to
   */
  public shardID!: number;

  /**
   * ID of the owner who owns this guild
   */
  public ownerID!: string;

  /**
   * The splash hash
   */
  public splash!: string | null;

  /**
   * The banner hash
   */
  public banner!: string | null;

  /**
   * Voice region ID for this guild
   */
  public region!: string;

  /**
   * `true` if this is considered a large guild
   */
  public large?: boolean;

  /**
   * The icon hash of the guild's icon
   */
  public icon!: string | null;

  /**
   * The guild's name
   */
  public name!: string;

  constructor(client: WebSocketClient, data: APIGuild) {
    super(data.id);

    this.voiceStates = new GuildVoiceStateStore(client);
    this.unavailable = false;
    this.presences = new GuildPresenceStore(client);
    this.channels = new ChannelStore(client);
    this.members = new GuildMemberStore(client);
    this.emojis = new GuildEmojiStore(client);
    this.client = client;
    this.roles = new GuildRoleStore(client);

    this.patch(data);
  }

  /** @internal */
  patch(data: Partial<APIGuild>) {
    if (data.default_message_notifications !== undefined)
      this.defaultMessageNotifications = data.default_message_notifications;

    if (data.approximate_presence_count !== undefined)
      this.approximatePresenceCount = data.approximate_presence_count;

    if (data.approximate_member_count !== undefined)
      this.approximateMemberCount = data.approximate_member_count;

    if (data.public_updates_channel_id !== undefined)
      this.publicUpdatesChannelID = data.public_updates_channel_id;

    if (data.explicit_content_filter !== undefined)
      this.explicitContentFilter = data.explicit_content_filter;

    if (data.max_video_channel_users !== undefined)
      this.maxVideoChannelUsers = data.max_video_channel_users;

    if (data.system_channel_flags !== undefined)
      this.systemChannelFlags = data.system_channel_flags;

    if (data.verification_level !== undefined)
      this.verificationLevel = data.verification_level;

    if (data.system_channel_id !== undefined)
      this.systemChannelID = data.system_channel_id;

    if (data.widget_channel_id !== undefined)
      this.widgetChannelID = data.widget_channel_id;

    if (data.discovery_splash !== undefined)
      this.discoverySplash = data.discovery_splash;

    if (data.preferred_locale !== undefined)
      this.preferredLocale = data.preferred_locale;

    if (data.rules_channel_id !== undefined)
      this.rulesChannelID = data.rules_channel_id;

    if (data.welcome_screen !== undefined)
      this.welcomeScreen = data.welcome_screen; // don't need a utility class for this x3

    if (data.application_id !== undefined)
      this.applicationID = data.application_id;

    if (data.widget_enabled !== undefined)
      this.widgetEnabled = data.widget_enabled;

    if (data.vanity_url_code !== undefined)
      this.vanityURLCode = data.vanity_url_code;

    if (data.afk_channel_id !== undefined)
      this.afkChannelID = data.afk_channel_id;

    if (data.max_presences !== undefined)
      this.maxPresences = data.max_presences;

    if (data.member_count !== undefined)
      this.memberCount = data.member_count;

    if (data.premium_tier !== undefined)
      this.premiumTier = data.premium_tier;

    if (data.description !== undefined)
      this.description = data.description;

    if (data.afk_timeout !== undefined)
      this.afkTimeout = data.afk_timeout;

    if (data.max_members !== undefined)
      this.maxMembers = data.max_members;

    if (data.premium_subscription_count !== undefined)
      this.boosters = data.premium_subscription_count;

    if (data.features !== undefined)
      // @ts-ignore same type, who cares :P
      this.features = data.features;

    if (data.icon_hash !== undefined)
      this.iconHash = data.icon_hash;

    if (data.mfa_level !== undefined)
      this.mfaLevel = data.mfa_level;

    if (data.joined_at !== undefined)
      this.joinedAt = new Date(data.joined_at);

    if (data.owner_id !== undefined)
      this.ownerID = data.owner_id;

    if (data.banner !== undefined)
      this.banner = data.banner;

    if (data.region !== undefined)
      this.region = data.region;

    if (data.large !== undefined)
      this.large = data.large;

    if (data.icon !== undefined)
      this.icon = data.icon;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.shard_id !== undefined)
      this.shardID = data.shard_id;

    if (data.voice_states !== undefined)
      for (let i = 0; i < data.voice_states.length; i++)
        this.voiceStates.put(new VoiceState(this.client, data.voice_states[i]));

    if (data.presences !== undefined)
      for (let i = 0; i < data.presences.length; i++)
        this.presences.put(new Presence(this.client, data.presences[i]));

    if (data.channels !== undefined)
      for (let i = 0; i < data.channels.length; i++) {
        const channel = Channel.from(this.client, data.channels[i]);
        if (channel === null)
          continue;

        this.client.channels.put(channel);
        this.channels.put(channel);
      }

    if (data.members !== undefined)
      for (let i = 0; i < data.members.length; i++)
        this.members.put(new Member(this.client, { guild_id: this.id, ...data.members[i] }));

    if (data.emojis !== undefined)
      for (let i = 0; i < data.emojis.length; i++)
        this.emojis.put(new Emoji(this.client, data.emojis[i]));

    if (data.roles !== undefined)
      for (let i = 0; i < data.roles.length; i++)
        this.roles.put(new Role({ guild_id: this.id, ...data.roles[i] }));
  }
}

DynamicImage.decorate(Guild, ['banner', 'splash', 'icon']);
export { Guild };
