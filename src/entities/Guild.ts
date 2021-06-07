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
import { GuildFeature, ImageFormats } from '../Constants';
import { ChannelStore } from '../stores/ChannelStore';
import { GuildEmojiStore } from '../stores/GuildEmojiStore';
import { GuildMemberStore } from '../stores/GuildMemberStore';
import { GuildPresenceStore } from '../stores/GuildPresenceStore';
import { GuildRoleStore } from '../stores/GuildRoleStore';
import { GuildVoiceStateStore } from '../stores/GuildVoiceStateStore';
import { StageInstance } from './StageInstance';

import type {
  APIGuild as _APIGuild,
  APIGuildPreview,
  APIGuildWelcomeScreen,
  RESTPatchAPIGuildJSONBody
} from 'discord-api-types';
import { VoiceState } from './VoiceState';
import { Channel } from './Channel';
import { Presence } from './Presence';
import { Member } from './Member';
import { Emoji } from './Emoji';
import { Role } from './Role';
import { UnavailableGuild } from './UnavailableGuild';
import { Application } from './Application';
import { User } from './User';
import { CDN, ImageFormat, ImageSize } from '@wumpcord/rest';

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

/**
 * https://discord.com/developers/docs/resources/guild#guild-preview-object
 */
// doesn't need a seperate entity
export interface GuildPreview {
  /**
   * The approximate count of online members in this guild
   */
  approximatePresenceCount: number;

  /**
   * The approximate count of members in this guild
   */
  approximateMemberCount: number;

  /**
   * The discovery splash hash
   */
  discoverySplash: string | null;

  /**
   * The description for community guilds
   */
  description: string | null;

  /**
   * List of features this guild has enabled
   */
  features: GuildFeature[];

  /**
   * Array of custom guild emojis
   */
  emojis: Emoji[];

  /**
   * The splash hash for the guild's splash
   */
  splash: string | null;

  /**
   * The name of the guild
   */
  name: string;

  /**
   * The icon hash for this guild's icon
   */
  icon: string | null;

  /**
   * The guild ID for this preview
   */
  id: string;
}

/**
 * https://discord.com/developers/docs/resources/guild#integration-object
 */
// doesn't need a seperate entity
export interface GuildIntegration {
  /**
   * The grace period (in days) before expiring subscribers
   */
  expireGracePeriod?: number;

  /**
   * Whether emoticons should be synced for this integration (Twitch is only currently supported)
   */
  enableEmoticons?: boolean;

  /**
   * The expire behaviour of expiring subscribers
   */
  expireBehaviour?: 'remove role' | 'kick';

  /**
   * How many subscribers this integration has
   */
  subscriberCount?: number;

  /**
   * The bot/OAuth2 application for discord integrations
   */
  application?: Application;

  /**
   * ISO8601-formatted timestamp when this integration
   * was last synced.
   */
  syncedAt?: Date;

  /**
   * If this integration is syncing or not
   */
  syncing?: boolean;

  /**
   * If this integration has been revoked or not
   */
  revoked?: boolean;

  /**
   * The role ID for this integration uses for "subscribers"
   */
  roleID?: string;

  /**
   * Account details of the integration
   */
  account: { name: string; id: string };

  /**
   * If this integration is enabled
   */
  enabled: boolean;

  /**
   * The user for this integration
   */
  user?: User;

  /**
   * The integration type ('twitch', 'youtube', or 'discord')
   */
  type: 'twitch' | 'youtube' | 'discord';

  /**
   * The integration name
   */
  name: string;

  /**
   * The integration ID
   */
  id: string;
}

/**
 * Options for modifying a guild
 */
export type ModifyGuildOptions = Partial<Pick<
  APIGuild,
  'name' | 'region' | 'verification_level' | 'default_message_notifications' | 'explicit_content_filter' | 'afk_channel_id'
  | 'afk_timeout' | 'icon' | 'owner_id' | 'splash' | 'discovery_splash' | 'banner' | 'system_channel_id' | 'system_channel_flags'
  | 'rules_channel_id' | 'public_updates_channel_id' | 'preferred_locale' | 'features' | 'description'
>>;

/**
 * https://discord.com/developers/docs/resources/guild
 */
export class Guild extends UnavailableGuild {
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
    super(data);

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

  /**
   * Returns new data for this [[Guild]].
   * @param withCounts If it should include the `?with_counts` query
   * parameter.
   */
  fetch(withCounts = true): Promise<this> {
    return this.client.rest.dispatch<never, APIGuild>({
      endpoint: `/guilds/${this.id}${withCounts === true ? '?with_counts=true' : ''}`,
      method: 'GET'
    }).then(data => {
      this.client.guilds.remove(this.id);
      this.patch(data);

      return this.client.guilds.put(this);
    });
  }

  /**
   * Returns the preview for this guild, if the bot
   * doesn't have access to the guild, the guild must have
   * the `DISCOVERABLE` feature enabled.
   */
  getPreview(): Promise<GuildPreview> {
    return this.client.rest.dispatch<never, APIGuildPreview>({
      endpoint: `/guilds/${this.id}/preview`,
      method: 'GET'
    }).then(data => ({
      approximatePresenceCount: data.approximate_presence_count,
      approximateMemberCount: data.approximate_member_count,
      discoverySplash: data.discovery_splash,
      description: data.description,
      features: data.features as any,
      emojis: data.emojis.map(d => new Emoji(this.client, d)),
      splash: data.splash,
      name: data.name,
      icon: data.icon,
      id: data.id
    }));
  }

  /**
   * Dynamically formats a guild icon
   * @param format The format to use
   * @param size The size to use
   */
  dynamicIconUrl(format: ImageFormat = 'png', size: ImageSize = 1024) {
    if (!ImageFormats.includes(format))
      throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return this.icon === null ? null : CDN.getGuildIcon(this.id, this.icon);
  }

  /**
   * Dynamically formats a guild banner
   * @param format The format to use (default `'png'`)
   * @param size The size to use (default `1024`)
   */
  dynamicBannerUrl(format: ImageFormat = 'png', size: ImageSize = 1024) {
    if (!ImageFormats.includes(format))
      throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return this.banner === null ? null : CDN.getGuildBanner(this.id, this.banner);
  }

  /**
   * Dynamically formats a guild splash screen
   * @param format The format to use (default `'png'`)
   * @param size The size to use (default `1024`)
   */
  dynamicSplashUrl(format: ImageFormat = 'png', size: ImageSize = 1024) {
    if (!ImageFormats.includes(format))
      throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return this.splash === null ? null : CDN.getGuildSplash(this.id, this.splash);
  }

  /**
   * Dynamically formats a guild discovery splash
   * @param format The format to use
   * @param size The size to use
   */
  dynamicDiscoverySplashUrl(format: ImageFormat = 'png', size: ImageSize = 1024) {
    if (!ImageFormats.includes(format))
      throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return this.discoverySplash === null ? null : CDN.getGuildDiscoverySplash(this.id, this.discoverySplash);
  }

  /**
   * Modifies a guild data, the bot must have the `MANAGE_SERVER`
   * permission to update data.
   */
  modify(data: ModifyGuildOptions = {}): Promise<this> {
    return this.client.rest.dispatch<RESTPatchAPIGuildJSONBody, APIGuild>({
      endpoint: `/guilds/${this.id}`,
      method: 'PATCH',
      data
    }).then(data => {
      this.client.guilds.remove(this.id);
      this.patch(data);

      return this.client.guilds.put(this);
    });
  }

  /**
   * Sets the name of the guild
   * @param name The name of the guild
   */
  setName(name: string) {
    return this.modify({ name });
  }

  /**
   * Sets the voice region for this guild
   * @param region The region ID or `null` to be automatic
   */
  setRegion(region: string) {
    return this.modify({ region });
  }

  /**
   * Sets the verification level for this guild
   * @param level The verification level
   */
  setVerificationLevel(level: number) {
    return this.modify({ verification_level: level });
  }

  /**
   * Sets the default message notification type
   * @param type The type of default message notification to use
   */
  setDefaultMessageNotifications(type: number) {
    return this.modify({ default_message_notifications: type });
  }

  /**
   * Sets the content explicit content filter
   * @param filter The filter type to use
   */
  setExplicitContentFilter(filter: number) {
    return this.modify({ explicit_content_filter: filter });
  }

  /**
   * Sets the AFK channel by it's snowflake
   *
   * @param id The ID of the afk channel, pass in
   * `null` if you want to reset the AFK channel.
   */
  setAFKChannel(id: string | null) {
    return this.modify({ afk_channel_id: id as `${bigint}` | null });
  }

  /**
   * Sets the AFK timeout
   */
}

/*
export type ModifyGuildOptions = Partial<Pick<
  APIGuild,
  'name' | 'region' | 'verification_level' | 'default_message_notifications' | 'explicit_content_filter' | 'afk_channel_id'
  | 'afk_timeout' | 'icon' | 'owner_id' | 'splash' | 'discovery_splash' | 'banner' | 'system_channel_id' | 'system_channel_flags'
  | 'rules_channel_id' | 'public_updates_channel_id' | 'preferred_locale' | 'features' | 'description'
>>;
*/
