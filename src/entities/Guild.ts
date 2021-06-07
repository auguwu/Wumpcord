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

/* eslint-disable default-param-last */
/* eslint-disable camelcase */

import type { APIGuildMember, APIStageInstance } from '..';
import type { WebSocketClient } from '../Client';
import { GuildFeature, OPCodes } from '../Constants';
import { ChannelStore } from '../stores/ChannelStore';
import { GuildEmojiStore } from '../stores/GuildEmojiStore';
import { GuildMemberStore } from '../stores/GuildMemberStore';
import { GuildPresenceStore } from '../stores/GuildPresenceStore';
import { GuildRoleStore } from '../stores/GuildRoleStore';
import { GuildVoiceStateStore } from '../stores/GuildVoiceStateStore';
import type { StageInstance } from './StageInstance';

import {
  APIBan,
  APIChannel,
  APIGuild as _APIGuild,
  APIGuildIntegration,
  APIGuildIntegrationApplication,
  APIGuildPreview,
  APIGuildWelcomeScreen,
  APIInvite,
  APIRole,
  APIVoiceRegion,
  GatewayRequestGuildMembersData,
  RESTGetAPIGuildVanityUrlResult,
  RESTPatchAPICurrentGuildMemberNicknameResult,
  RESTPatchAPIGuildChannelPositionsJSONBody,
  RESTPatchAPIGuildJSONBody,
  RESTPatchAPIGuildMemberJSONBody,
  RESTPatchAPIGuildRoleJSONBody,
  RESTPatchAPIGuildRolePositionsJSONBody,
  RESTPostAPIGuildChannelJSONBody,
  RESTPostAPIGuildPruneJSONBody,
  RESTPostAPIGuildRoleJSONBody,
  RESTPutAPIGuildBanJSONBody
} from 'discord-api-types';
import { VoiceState } from './VoiceState';
import { Channel } from './Channel';
import { Presence } from './Presence';
import { Member } from './Member';
import { Emoji } from './Emoji';
import { Role } from './Role';
import { UnavailableGuild } from './UnavailableGuild';
import { User } from './User';
import { CDN } from '@wumpcord/rest';
import { Readable } from 'stream';
import { GuildChannel } from './channels/GuildChannel';
import { Collection } from '@augu/collections';
import Util from '../util';
import { Invite } from './Invite';

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
  application?: APIGuildIntegrationApplication;

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
 * https://discord.com/developers/docs/topics/gateway#request-guild-members
 */
export interface FetchGuildMembersOptions {
  /**
   * If the fetching should include presences
   */
  presences?: boolean;

  /**
   * Maximum number of members to send matching the query; a limit
   * of `0` can be used with an empty string query to return all members
   */
  limit?: number;

  /**
   * A query to fetch all guild members, this can be undefined
   * to retrieve all guild members
   */
  query?: string;

  /**
   * Nonce string to verify the `Guild Members Chunk` response.
   */
  nonce?: string;

  /**
   * The time for the delay for retrieving members in chunks
   */
  time?: number;

  /**
   * The user IDs to specificy which users we wish to fetch one
   * of the query or `ids`.
   */
  ids?: string | string[];
}

/**
 * Options for modifying a guild
 */
export type ModifyGuildOptions = Partial<Pick<
  APIGuild,
  'name' | 'region' | 'verification_level' | 'default_message_notifications' | 'explicit_content_filter' | 'afk_channel_id'
  | 'afk_timeout' | 'icon' | 'owner_id' | 'splash' | 'discovery_splash' | 'banner' | 'system_channel_id' | 'system_channel_flags'
  | 'rules_channel_id' | 'public_updates_channel_id' | 'preferred_locale' | 'description'
>>;

/**
 * Options for creating a guild channel
 */
export type CreateChannelOptions = Partial<Pick<
  APIChannel,
  'type' | 'topic' | 'bitrate' | 'user_limit' | 'rate_limit_per_user' | 'position'
  | 'permission_overwrites' | 'nsfw'
> & { parent_id: string }>;

/**
 * https://discord.com/developers/docs/resources/guild#list-guild-members-query-string-params
 */
export interface ListGuildMembersOptions {
  /**
   * Max number of members to return
   */
  limit?: number;

  /**
   * The highest user ID in the previous page
   */
  after?: string;
}

/**
 * https://discord.com/developers/docs/resources/guild#modify-guild-member-json-params
 */
export type ModifyGuildMemberOptions = Partial<Pick<APIGuildMember, 'deaf' | 'mute' | 'nick'> & { channel_id: string, roles: string[] }>;

/**
 * https://discord.com/developers/docs/resources/guild#ban-object
 */
export interface GuildBan {
  reason: string | null;
  user: User;
}

/**
 * https://discord.com/developers/docs/resources/guild#create-guild-role-json-params
 */
export type CreateGuildRoleOptions = Partial<Pick<APIRole, 'name' | 'color' | 'hoist' | 'mentionable'> & { permissions: bigint; }>;

/**
 * https://discord.com/developers/docs/resources/guild#modify-guild-role-json-params
 */
export type ModifyGuildRoleOptions = CreateGuildRoleOptions;

/**
 * https://discord.com/developers/docs/resources/guild#guild-widget-object
 */
export interface GuildWidget {
  /**
   * The channel ID, if enabled or `null` if not.
   */
  channelID: string | null;

  /**
   * Whether the widget is enabled
   */
  enabled: boolean;
}

/**
 * https://discord.com/developers/docs/resources/guild#modify-guild-welcome-screen-json-params
 */
export type ModifyGuildWelcomeScreenOptions = Partial<Pick<APIGuildWelcomeScreen, 'welcome_channels' | 'description'> & { enabled: boolean }>;

/**
 * https://discord.com/developers/docs/resources/guild#update-current-user-voice-state-json-params or
 * https://discord.com/developers/docs/resources/guild#update-user-voice-state-json-params
 */
export type ModifyUserGuildVoiceState<S extends '@me' | 'user' = '@me'> = S extends '@me'
  ? Partial<{ suppress: boolean; request_to_speak_timestamp: Date; }>
  : { suppress?: boolean };

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
   * Returns the guild icon URL, if any.
   */
  get iconUrl() {
    return this.icon === null ? null : CDN.getGuildIcon(this.id, this.icon);
  }

  /**
   * Returns the guild banner if the guild has reached level 2 in boosts
   * or is a partnered server.
   */
  get bannerUrl() {
    return this.banner === null ? null : CDN.getGuildBanner(this.id, this.banner);
  }

  /**
   * Returns the guild splash URL or `null` if the guild doesn't have an
   * invite splash.
   */
  get splashUrl() {
    return this.splash === null ? null : CDN.getGuildSplash(this.id, this.splash);
  }

  /**
   * Returns the discovery splash URL, if any has been provided
   */
  get discoverySplashUrl() {
    return this.discoverySplash === null ? null : CDN.getGuildDiscoverySplash(this.id, this.discoverySplash);
  }

  /**
   * Returns the owner of this guild, if cached
   */
  get owner() {
    return this.client.users.get(this.ownerID);
  }

  /**
   * Returns the shard for this guild
   */
  get shard() {
    return this.client.shards.get(this.shardID)!;
  }

  /**
   * Returns new data for this [[Guild]].
   * @param withCounts If it should include the `?with_counts` query
   * parameter.
   */
  fetch(withCounts = true): Promise<Guild> {
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

  fetchMembers({
    presences,
    limit,
    query,
    nonce,
    time,
    ids
  }: FetchGuildMembersOptions = {
    presences: false,
    limit: 0,
    query: '',
    time: 120e3,
    nonce: Date.now().toString(16),
    ids: []
  }) {
    return new Promise<Collection<string, Member>>((resolve, reject) => {
      if (
        this.memberCount === this.members.size,
        !limit &&
        !presences &&
        !query &&
        !ids
      ) return resolve(this.members);

      if (nonce && nonce.length > 32) return reject(new RangeError('Nonce length was over 32'));
      if (this.shard === undefined) return reject(new Error(`Shard #${this.shardID} doesn't exist...?`));

      this.shard.send<GatewayRequestGuildMembersData>(OPCodes.GetGuildMembers, {
        user_ids: ids as `${bigint}` | `${bigint}`[],
        presences,
        query: query ?? '',
        nonce,
        limit: limit ?? this.maxMembers ?? 250000,
        guild_id: this.id as `${bigint}`
      });

      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        return reject(new Error(`Unable to retrieve new members in ${(time ?? 120e2) / 1000}s.`));
      }, time ?? 120e2);

      const handler = () => {
        // TODO: this
      };

      // this.client.on('guildMembersChunk', handler);
    });
  }

  /**
   * Modifies attributes of a guild, the bot must have the `MANAGE_SERVER`
   * permission to update data.
   *
   * @param data The data to modify
   * @param reason The reason to put in audit logs
   */
  modify(data: ModifyGuildOptions = {}, reason?: string): Promise<Guild> { // eslint-disable-line default-param-last
    return this.client.rest.dispatch<RESTPatchAPIGuildJSONBody, APIGuild>({
      auditLogReason: reason,
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
   * @param reason The reason to put in audit logs
   */
  setName(name: string, reason?: string) {
    return this.modify({ name }, reason);
  }

  /**
   * Sets the voice region for this guild
   * @param region The region ID or `null` to be automatic
   * @param reason The reason to put in audit logs
   */
  setRegion(region: string, reason?: string) {
    return this.modify({ region }, reason);
  }

  /**
   * Sets the verification level for this guild
   * @param level The verification level
   * @param reason The reason to put in audit logs
   */
  setVerificationLevel(level: number, reason?: string) {
    return this.modify({ verification_level: level }, reason);
  }

  /**
   * Sets the default message notification type
   * @param type The type of default message notification to use
   * @param reason The reason to put in audit logs
   */
  setDefaultMessageNotifications(type: number, reason?: string) {
    return this.modify({ default_message_notifications: type }, reason);
  }

  /**
   * Sets the content explicit content filter
   * @param filter The filter type to use
   * @param reason The reason to put in audit logs
   */
  setExplicitContentFilter(filter: number, reason?: string) {
    return this.modify({ explicit_content_filter: filter }, reason);
  }

  /**
   * Sets the AFK channel by it's snowflake
   *
   * @param id The ID of the afk channel, pass in
   * `null` if you want to reset the AFK channel.
   *
   * @param reason The reason to put in audit logs
   */
  setAFKChannel(id: string | null, reason?: string) {
    return this.modify({ afk_channel_id: id as `${bigint}` | null }, reason);
  }

  /**
   * Sets the AFK timeout
   * @param timeout The timeout in seconds
   * @param reason The reason to put in audit logs
   */
  setAFKTimeout(timeout: number, reason?: string) {
    return this.modify({ afk_timeout: timeout }, reason);
  }

  /**
   * Sets the guild icon
   *
   * @param icon A `Readable` stream or a `Buffer` to set the icon URL.
   * @param reason The reason to put in audit logs
   * @note Using readable streams takes O(N) the complexity time to
   * gather all buffers into one. Recommend to use `readFileSync(...)`
   * or use your http client's methods to return a `Buffer`.
   */
  async setIcon(data: Readable | Buffer, reason?: string) {
    let image!: Buffer;
    if (Util.isReadableStream(data)) {
      image = await Util.readableToBuffer(data);
    } else if (Buffer.isBuffer(data)) {
      image = data;
    } else {
      throw new TypeError(`Expecting \`Readable\` (createReadStream) or \`Buffer\` (readFileSync, ...); gotten \`${typeof data === 'object' ? '(other object/class/array or null)' : typeof data}`);
    }

    return this.modify({
      icon: Util.bufferToBase64(image)
    }, reason);
  }

  /**
   * Sets the owner of this guild, the bot must
   * own this guild to set the owner.
   *
   * @param id The user's ID who will own this guild
   * @param reason The reason to put in audit logs
   */
  setOwner(id: string, reason?: string) {
    return this.modify({ owner_id: id as `${bigint}` }, reason);
  }

  /**
   * Sets the guild splash
   *
   * @param icon A `Readable` stream or a `Buffer` to set the icon URL.
   * @param reason The reason to put in audit logs
   * @note Using readable streams takes O(N) the complexity time to
   * gather all buffers into one. Recommend to use `readFileSync(...)`
   * or use your http client's methods to return a `Buffer`.
   */
  async setSplash(data: Readable | Buffer, reason?: string) {
    let image!: Buffer;
    if (Util.isReadableStream(data)) {
      image = await Util.readableToBuffer(data);
    } else if (Buffer.isBuffer(data)) {
      image = data;
    } else {
      throw new TypeError(`Expecting \`Readable\` (createReadStream) or \`Buffer\` (readFileSync, ...); gotten \`${typeof data === 'object' ? '(other object/class/array or null)' : typeof data}`);
    }

    return this.modify({
      splash: Util.bufferToBase64(image)
    }, reason);
  }

  /**
   * Sets the discovery splash
   *
   * @param icon A `Readable` stream or a `Buffer` to set the icon URL.
   * @param reason The reason to put in audit logs
   * @note Using readable streams takes O(N) the complexity time to
   * gather all buffers into one. Recommend to use `readFileSync(...)`
   * or use your http client's methods to return a `Buffer`.
   */
  async setDiscoverySplash(data: Readable | Buffer, reason?: string) {
    let image!: Buffer;
    if (Util.isReadableStream(data)) {
      image = await Util.readableToBuffer(data);
    } else if (Buffer.isBuffer(data)) {
      image = data;
    } else {
      throw new TypeError(`Expecting \`Readable\` (createReadStream) or \`Buffer\` (readFileSync, ...); gotten \`${typeof data === 'object' ? '(other object/class/array or null)' : typeof data}`);
    }

    return this.modify({
      discovery_splash: Util.bufferToBase64(image)
    }, reason);
  }

  /**
   * Sets the guild banner
   *
   * @param icon A `Readable` stream or a `Buffer` to set the icon URL.
   * @param reason The reason to put in audit logs
   * @note Using readable streams takes O(N) the complexity time to
   * gather all buffers into one. Recommend to use `readFileSync(...)`
   * or use your http client's methods to return a `Buffer`.
   */
  async setGuildBanner(data: Readable | Buffer, reason?: string) {
    let image!: Buffer;
    if (Util.isReadableStream(data)) {
      image = await Util.readableToBuffer(data);
    } else if (Buffer.isBuffer(data)) {
      image = data;
    } else {
      throw new TypeError(`Expecting \`Readable\` (createReadStream) or \`Buffer\` (readFileSync, ...); gotten \`${typeof data === 'object' ? '(other object/class/array or null)' : typeof data}`);
    }

    return this.modify({
      banner: Util.bufferToBase64(image)
    }, reason);
  }

  /**
   * Sets the system channel ID
   * @param id The ID for the system channel
   * @param reason The reason to put in audit logs
   */
  setSystemChannel(id: string, reason?: string) {
    return this.modify({ system_channel_id: id as `${bigint}` }, reason);
  }

  /**
   * Sets the system channel flags
   * @param flags The flags to set
   * @param reason The reason to put in audit logs
   */
  setSystemChannelFlags(flags: number, reason?: string) {
    return this.modify({ system_channel_flags: flags }, reason);
  }

  /**
   * Sets a new rules channel
   * @param id The rules channel ID
   * @param reason The reason to put in audit logs
   */
  setRulesChannel(id: string, reason?: string) {
    return this.modify({ rules_channel_id: id as `${bigint}` }, reason);
  }

  /**
   * Sets a new public updates channel
   * @param id The public update channel ID
   * @param reason The reason to put in audit logs
   */
  setPublicUpdatesChannel(id: string, reason?: string) {
    return this.modify({ public_updates_channel_id: id as `${bigint}` }, reason);
  }

  /**
   * Sets the preferred locale for this guild
   *
   * @param locale The locale to set, omit this parameter
   * to set to `"en-US"`
   * @param reason The reason to put in audit logs
   */
  setPreferredLocale(locale?: string, reason?: string) {
    return this.modify({ preferred_locale: locale ?? 'en-US' }, reason);
  }

  /**
   * Sets the description of the community guild
   * @param description The description
   * @param reason The reason to put in audit logs
   */
  setDescription(description: string, reason?: string) {
    return this.modify({ description }, reason);
  }

  /**
   * Deletes the guild from Discord, fires a [Guild Delete](https://discord.com/developers/docs/topics/gateway#guild-delete)
   * gateway event.
   */
  delete() {
    return this.client.rest.dispatch<never, void>({
      endpoint: `/guilds/${this.id}`,
      method: 'DELETE'
    });
  }

  /**
   * Returns all the channels in this guild.
   */
  getChannels(): Promise<GuildChannel[]> {
    return this.client.rest.dispatch<never, APIChannel[]>({
      endpoint: `/guilds/${this.id}/channels`,
      method: 'GET'
    }).then(data => data.map(d => new GuildChannel(this.client, d)));
  }

  /**
   * Creates a new guild channel
   * @param name The name of the channel
   * @param options The options to create this guild channel
   * @param reason The reason to put in audit logs
   */
  createChannel(name: string, options: CreateChannelOptions = {}, reason?: string): Promise<GuildChannel | undefined> { // eslint-disable-line default-param-last
    return this.client.rest.dispatch<RESTPostAPIGuildChannelJSONBody, APIChannel>({
      endpoint: `/guilds/${this.id}/channels`,
      method: 'POST',
      data: {
        name,
        ...options
      }
    }).then(d => {
      const channel = Channel.from<GuildChannel>(this.client, d);
      if (channel === null) return undefined;

      this.client.channels.put(channel);
      this.channels.put(channel);
      return channel;
    });
  }

  /**
   * Modifies a specific channel's position in the guild channel tree.
   * @param channelID The channel's ID
   * @param pos The sorting position to set it to
   */
  async editChannelPosition(channelID: string, pos: number): Promise<void> {
    const channels = await this.getChannels();
    const channel = channels.find(channel => channel.id === channelID)!;
    if (channel.position === pos)
      return Promise.resolve();

    const min = Math.min(pos, channel.position);
    const max = Math.max(pos, channel.position);
    const sorted = channels.filter(chan =>
      chan.type === channel.type
        && min <= chan.position
        && chan.position <= max
        && chan.id !== channelID
    ).sort((a, b) => a.position - b.position);

    pos > channel.position ? sorted.push(channel) : sorted.unshift(channel);
    return this.client.rest.dispatch<RESTPatchAPIGuildChannelPositionsJSONBody, void>({
      endpoint: `/guilds/${this.id}/channels`,
      method: 'PATCH',
      data: sorted.map((channel, idx) => ({
        position: idx + min,
        id: channel.id as `${bigint}`
      }))
    });
  }

  /**
   * Retrieves a guild member in this guild
   * @param memberID The member's ID
   */
  getMember(memberID: string) {
    return this.client.rest.dispatch<never, APIGuildMember>({
      endpoint: `/guilds/${this.id}/members/${memberID}`,
      method: 'GET'
    }).then(data => new Member(this.client, data));
  }

  /**
   * Returns a list of guild members available in this guild
   * @param options The options to use
   */
  listMembers(options: ListGuildMembersOptions = {}) {
    return this.client.rest.dispatch<never, APIGuildMember[]>({
      endpoint: `/guilds/${this.id}/members${Util.objectToQuery(options)}`,
      method: 'GET'
    }).then(d => d.map(s => new Member(this.client, s)));
  }

  /**
   * Returns a list of guilds members by a query whose username
   * or nickname starts with.
   *
   * @param query The query to find the members
   * @param limit The max limit to return
   */
  searchMembers(query: string, limit?: number) {
    return this.client.rest.dispatch<never, APIGuildMember[]>({
      endpoint: `/guilds/${this.id}/members/search${Util.objectToQuery({ query, limit })}`,
      method: 'GET'
    }).then(d => d.map(s => new Member(this.client, s)));
  }

  /**
   * Modify attributes of a guild member.
   * @param id The member's ID
   * @param options The options to use
   * @param reason The reason to put in audit logs
   */
  modifyMember(id: string, options: ModifyGuildMemberOptions = {}, reason?: string) { // eslint-disable-line default-param-last
    return this.client.rest.dispatch<RESTPatchAPIGuildMemberJSONBody, APIGuildMember>({
      endpoint: `/guilds/${this.id}/members/${id}`,
      method: 'PATCH',
      data: options as any
    }).then(d => this.members.put(new Member(this.client, d)));
  }

  /**
   * Modifies the nickname of the bot in this guild
   *
   * @param nick The nickname to use, omit this parameter
   * to reset the nickname.
   */
  modifyNickname(nick?: string) {
    return this.client.rest.dispatch<RESTPatchAPICurrentGuildMemberNicknameResult, APIGuildMember>({
      endpoint: `/guilds/${this.id}/members/@me/nick`,
      method: 'PATCH',
      data: { nick: nick as `${bigint}` }
    }).then(d => this.members.put(new Member(this.client, d)));
  }

  /**
   * Adds a role to a member
   * @param memberID The member's ID
   * @param roleID The role's ID
   * @param reason The reason to put in audit logs
   */
  addRole(memberID: string, roleID: string, reason?: string) {
    return this.client.rest.dispatch<never, void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/members/${memberID}/roles/${roleID}`,
      method: 'PUT'
    });
  }

  /**
   * Removes a role from a member
   * @param memberID The member's ID
   * @param roleID The role's ID
   * @param reason The reason to put in audit logs
   */
  removeRole(memberID: string, roleID: string, reason?: string) {
    return this.client.rest.dispatch<never, void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/members/${memberID}/roles/${roleID}`,
      method: 'DELETE'
    });
  }

  /**
   * Kicks a member from the guild
   * @param memberID The member's ID
   */
  kickMember(memberID: string, reason?: string) {
    return this.client.rest.dispatch<never, void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/members/${memberID}`,
      method: 'DELETE'
    });
  }

  /**
   * Retrieve all the bans in this guild
   */
  getBans(): Promise<GuildBan[]> {
    return this.client.rest.dispatch<never, APIBan[]>({
      endpoint: `/guilds/${this.id}/bans`,
      method: 'GET'
    }).then(d => d.map(s => ({
      reason: s.reason,
      user: new User(this.client, s.user)
    })));
  }

  /**
   * Retrieve a single ban
   * @param userID The user's ID
   */
  getBan(userID: string): Promise<GuildBan> {
    return this.client.rest.dispatch<never, APIBan>({
      endpoint: `/guilds/${this.id}/bans/${userID}`,
      method: 'GET'
    }).then(d => ({
      reason: d.reason,
      user: new User(this.client, d.user)
    }));
  }

  /**
   * Bans a member from the guild
   * @param userID The user ID
   * @param days The number of days to bulk-delete message
   * @param reason The reason to set in audit logs and when retrieving bans
   */
  banMember(userID: string, days = 7, reason?: string) { // eslint-disable-line default-param-last
    return this.client.rest.dispatch<RESTPutAPIGuildBanJSONBody, void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/bans/${userID}`,
      method: 'PUT',
      data: {
        delete_message_days: days
      }
    });
  }

  /**
   * Removes a ban from a user
   * @param userID The user's ID
   */
  unbanMember(userID: string) {
    return this.client.rest.dispatch<never, void>({
      endpoint: `/guilds/${this.id}/bans/${userID}`,
      method: 'DELETE'
    });
  }

  /**
   * Retrieves all the guild roles available
   */
  getRoles(): Promise<Role[]> {
    return this.client.rest.dispatch<never, APIRole[]>({
      endpoint: `/guilds/${this.id}/roles`,
      method: 'GET'
    }).then(d => d.map(s => new Role({ guild_id: this.id, ...s })));
  }

  /**
   * Creates a guild role
   * @param options The options to use
   * @param reason The reason to put in audit logs
   */
  createRole(options: CreateGuildRoleOptions = {}, reason?: string) {
    return this.client.rest.dispatch<RESTPostAPIGuildRoleJSONBody, APIRole>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/roles`,
      method: 'POST',
      data: options as any
    }).then(d => this.roles.put(new Role({ guild_id: this.id, ...d })));
  }

  /**
   * Modifies the position of a role in the guild role tree.
   * @param roleID The role ID to edit the position
   * @param pos The position to set to
   */
  async editRolePosition(roleID: string, pos: number) {
    const roles = await this.getRoles();
    const role = roles.find(channel => channel.id === roleID)!;
    if (role.position === pos)
      return Promise.resolve();

    const min = Math.min(pos, role.position);
    const max = Math.max(pos, role.position);
    const sorted = roles.filter(r =>
      min <= r.position
        && r.position <= max
        && r.id !== roleID
    ).sort((a, b) => a.position - b.position);

    pos > role.position ? sorted.push(role) : sorted.unshift(role);
    return this.client.rest.dispatch<RESTPatchAPIGuildRolePositionsJSONBody, void>({
      endpoint: `/guilds/${this.id}/roles`,
      method: 'PATCH',
      data: sorted.map((channel, idx) => ({
        position: idx + min,
        id: channel.id as `${bigint}`
      }))
    });
  }

  /**
   * Modifies attributes of a guild role.
   *
   * @param roleID The role ID
   * @param options The options to set
   * @param reason The reason to put in audit logs
   */
  modifyRole(roleID: string, options: ModifyGuildRoleOptions = {}, reason?: string) {
    return this.client.rest.dispatch<RESTPatchAPIGuildRoleJSONBody, APIRole>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/roles/${roleID}`,
      method: 'PATCH',
      data: <any> options
    }).then(d => this.roles.put(new Role({ guild_id: this.id, ...d })));
  }

  /**
   * Deletes a role in the guild
   * @param roleID The role's ID
   * @param reason The reason to put in audit logs
   */
  deleteRole(roleID: string, reason?: string) {
    return this.client.rest.dispatch<never, void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/roles/${roleID}`,
      method: 'DELETE'
    });
  }

  /**
   * Returns the number of members that were removed
   * due a prune operation.
   */
  getPruneCount() {
    return this.client.rest.dispatch<never, { pruned: number }>({
      endpoint: `/guilds/${this.id}/prune`,
      method: 'GET'
    }).then(({ pruned }) => pruned);
  }

  /**
   * Beings a prune operation, requires the `KICK_MEMBERS` permission. Returns
   * the number of members that were removed in this prune operation, in large
   * guilds, this will return `null`.
   *
   * @param days The amount of days to prune
   * @param includeRoles Any roles to include when pruning
   * @param reason The reason to set in audit logs
   */
  beginePrune(days: number = 7, includeRoles?: string[], reason?: string) {
    const computePruneCount = this.large === true || this.large === undefined; // if it's undefined, compute anyway

    return this.client.rest.dispatch<RESTPostAPIGuildPruneJSONBody, { pruned: number | null }>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/prune`,
      method: 'POST',
      data: {
        days,
        compute_prune_count: computePruneCount,
        include_roles: includeRoles as `${bigint}`[]
      }
    }).then(({ pruned }) => computePruneCount ? pruned as number : null);
  }

  /**
   * Returns a list of voice regions for the guild.
   */
  getVoiceRegions() {
    return this.client.rest.dispatch<never, APIVoiceRegion[]>({
      endpoint: `/guilds/${this.id}/regions`,
      method: 'GET'
    });
  }

  /**
   * Returns a list of the integrations in this guild.
   */
  getIntegrations(): Promise<GuildIntegration[]> {
    return this.client.rest.dispatch<never, APIGuildIntegration[]>({
      endpoint: `/guilds/${this.id}/integrations`,
      method: 'GET'
    }).then(d => d.map(s => ({
      expireGracePeriod: s.expire_grace_period,
      enableEmotions: s.enable_emoticons,
      expireBehaviour: s.expire_behavior !== undefined
        ? s.expire_behavior === 0
          ? 'remove role'
          : 'kick'
        : undefined,

      subscriberCount: s.subscriber_count,
      application: s.application,
      syncedAt: s.synced_at !== undefined ? new Date(s.synced_at) : undefined,
      syncing: s.syncing,
      revoked: s.revoked,
      roleID: s.role_id,
      account: s.account,
      enabled: s.enabled,
      user: s.user !== undefined ? new User(this.client, s.user) : undefined,
      type: s.type,
      name: s.name,
      id: s.id
    })));
  }

  /**
   * Deletes a guild integration
   * @param id The integration ID
   */
  deleteIntegration(id: string) {
    return this.client.rest.dispatch<never, void>({
      endpoint: `/guilds/${this.id}/integrations/${id}`,
      method: 'DELETE'
    });
  }

  /**
   * Returns a list of guild invites with metadata.
   */
  getInvites(): Promise<Invite<'withMetadata'>> {
    return this.client.rest.dispatch<never, APIInvite[]>({
      endpoint: `/guilds/${this.id}/invites`,
      method: 'GET'
    }).then(d => d.map(s => new Invite<'withMetadata'>(this.client, s)) as any);
  }

  /**
   * Get the guild's widget object
   */
  getWidget(): Promise<GuildWidget> {
    return this.client.rest.dispatch<never, GuildWidget>({
      endpoint: `/guilds/${this.id}/widget`,
      method: 'GET'
    }).then(d => ({
      enabled: d.enabled,
      channelID: (d as any).channel_id
    }));
  }

  /**
   * Modifies the guild widget
   * @param enabled If the widget is enabled or not
   * @param channelID The channel ID or `null` if none should be set.
   */
  modifyWidget(enabled: true, channelID: string | null): Promise<void>;

  /**
   * Modifies the guild widget
   * @param enabled If the widget should be disabled
   */
  modifyWidget(enabled: false): Promise<void>;
  modifyWidget(enabled: boolean, channelID?: string | null) {
    const data = enabled === true ? { enabled, channelID } : { enabled: false };
    return this.client.rest.dispatch<any, void>({
      endpoint: `/guilds/${this.id}/widget`,
      method: 'PATCH',
      data
    });
  }

  /**
   * Returns a partial invite of `[code, uses]` if this guild
   * has the `VANITY_URL` feature.
   */
  getVanityUrl(): Promise<[code: string | null, uses: number]> {
    return this.client.rest.dispatch<never, RESTGetAPIGuildVanityUrlResult>({
      endpoint: `/guilds/${this.id}/vanity-url`,
      method: 'GET'
    }).then(d => [d.code, d.uses]);
  }

  /**
   * Returns the welcome screen object for this guild
   */
  getWelcomeScreen() {
    return this.client.rest.dispatch<never, APIGuildWelcomeScreen>({
      endpoint: `/guilds/${this.id}/welcome-screen`,
      method: 'GET'
    });
  }

  /**
   * Modifies the welcome screen
   * @param options Any additional options to use
   */
  modifyWelcomeScreen(options: ModifyGuildWelcomeScreenOptions = {}) {
    return this.client.rest.dispatch<any, void>({
      endpoint: `/guilds/${this.id}/welcome-screen`,
      method: 'PATCH',
      data: options
    });
  }

  /**
   * Modifies the bot's voice state in this guild
   * @param options Any additional options to use
   */
  modifyVoiceState(channelID: string, options?: ModifyUserGuildVoiceState<'@me'>): Promise<void>;

  /**
   * Modifies a user's voice state in this guild
   * @param userID The user's ID
   * @param channelID The channel's ID
   * @param options Any additional options to use
   */
  modifyVoiceState(userID: string, channelID: string, options?: ModifyUserGuildVoiceState<'user'>): Promise<void>;
  modifyVoiceState(userOrChanID: string, channelOrOptions?: string | ModifyUserGuildVoiceState<'@me'>, opts: ModifyUserGuildVoiceState<'user'> = {}) {
    const endpoint = typeof channelOrOptions === 'string'
      ? `/guilds/${this.id}/voice-states/${userOrChanID}`
      : `/guilds/${this.id}/voice-states/@me`;

    const data = typeof channelOrOptions === 'string' ? opts : channelOrOptions;

    return this.client.rest.dispatch({
      endpoint,
      method: 'PATCH',
      data
    });
  }
}
