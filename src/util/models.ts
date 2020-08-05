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

// Modeled Discord API Objects
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-interface */

import type { OPCodes, EventType, AuditLogActions, ChannelTypes, MessageTypes, ActivityFlags, Permissions } from './Constants';

type ValueOf<V> = V[keyof V]; // typescript PLEASE add `valueof` im begging u im so ready to make a PR of it smh

/**
 * Modeled for endpoint /bot/gateway
 */
export interface BotGateway extends Gateway {
  session_start_limit: SessionStartLimit;
  shards: number;
}

interface SessionStartLimit {
  reset_after: number;
  remaining: number;
  total: number;
}

/**
 * Modeled for endpoint /gateway
 */
export interface Gateway {
  url: string;
}

// Credit: https://github.com/itslukej/discord.d.ts
type ReceivableOpCode = OPCodes.Hello | OPCodes.Heartbeat | OPCodes.HeartbeatAck | OPCodes.InvalidSession | OPCodes.Reconnect;

export interface Event {
  op: ReceivableOpCode;
  d: unknown;
}

export interface DispatchEvent {
  op: OPCodes.Event;
  s: number;
  t: EventType;
}

export interface UnavaliableGuildPacket {
  unavaliable: false;
  id: string;
}

export enum NitroType {
  Classic = 1,
  Full    = 2
}

export interface UserPacket {
  premium_type?: NitroType;
  discriminator: string;
  mfa_enabled: boolean;
  verified?: boolean;
  username: string;
  avatar?: string;
  system?: boolean;
  locale?: boolean;
  email?: boolean;
  flags?: number;
  bot?: boolean;
  id: string;
}

export interface AttachmentPacket {
  proxy_url: string;
  filename: string;
  height?: number;
  width?: number;
  size: number;
  url: string;
  id: string;
}

export interface AuditLogPacket {
  audit_log_entries: AuditLogEntryPacket[];
  integrations: Partial<IntegrationPacket>[];
  webhooks: WebhookPacket[];
  users: UserPacket[];
}

export interface AuditLogEntryPacket {
  action_type: AuditLogActions;
  target_id: string | null;
  options?: Partial<AuditEntryInfoPacket>;
  changes?: AuditLogChangePacket[];
  reason?: string;
  user_id: string;
  id: string;
}

export interface AuditEntryInfoPacket {
  delete_member_days: string;
  members_removed: string;
  channel_id: string;
  message_id: string;
  role_name: string;
  count: string;
  type: 'role' | 'member';
  id: string;
}

export type AuditLogChangePacket =
	& AuditLogChangeInfo<'name', string>
	& AuditLogChangeInfo<'icon_hash', string>
	& AuditLogChangeInfo<'splash_hash', string>
	& AuditLogChangeInfo<'owner_id', string>
	& AuditLogChangeInfo<'region', string>
	& AuditLogChangeInfo<'afk_channel_id', string>
	& AuditLogChangeInfo<'afk_timeout', string>
	& AuditLogChangeInfo<'mfa_level', MFALevel>
	& AuditLogChangeInfo<'verification_level', VerificationLevel>
	& AuditLogChangeInfo<'explicit_content_filter', ExplicitContentFilterLevel>
	& AuditLogChangeInfo<'default_message_notifications', MessageNotificationsLevel>
	& AuditLogChangeInfo<'vanity_url_code', string>
	& AuditLogChangeInfo<'$add', Partial<RolePacket>[]>
	& AuditLogChangeInfo<'$remove', Partial<RolePacket>[]>
	& AuditLogChangeInfo<'prune_delete_days', number>
	& AuditLogChangeInfo<'widget_enabled', boolean>
	& AuditLogChangeInfo<'widget_channel_id', string>
	& AuditLogChangeInfo<'system_channel_id', string>
	& AuditLogChangeInfo<'position', number>
	& AuditLogChangeInfo<'topic', string>
	& AuditLogChangeInfo<'bitrate', number>
	& AuditLogChangeInfo<'permission_overwrites', Partial<PermissionOverwritePacket>[]>
	& AuditLogChangeInfo<'nsfw', boolean>
	& AuditLogChangeInfo<'application_id', string>
	& AuditLogChangeInfo<'rate_limit_per_user', number>
	& AuditLogChangeInfo<'permissions', number>
	& AuditLogChangeInfo<'color', number>
	& AuditLogChangeInfo<'hoist', boolean>
	& AuditLogChangeInfo<'mentionable', boolean>
	& AuditLogChangeInfo<'allow', number>
	& AuditLogChangeInfo<'deny', number>
	& AuditLogChangeInfo<'code', number>
	& AuditLogChangeInfo<'channel_id', string>
	& AuditLogChangeInfo<'inviter_id', string>
	& AuditLogChangeInfo<'max_uses', number>
	& AuditLogChangeInfo<'uses', number>
	& AuditLogChangeInfo<'max_age', null>
	& AuditLogChangeInfo<'temporary', boolean>
	& AuditLogChangeInfo<'deaf', boolean>
	& AuditLogChangeInfo<'mute', boolean>
	& AuditLogChangeInfo<'nick', string>
	& AuditLogChangeInfo<'avatar_hash', string>
	& AuditLogChangeInfo<'id', string>
	& AuditLogChangeInfo<'type', ChannelTypes | string>
	& AuditLogChangeInfo<'enable_emoticons', boolean>
	& AuditLogChangeInfo<'expire_behavior', number>
	& AuditLogChangeInfo<'expire_grace_period', number>;

export interface AuditLogChangeInfo<K extends string, T> {	
  old_value?: T;
  new_value?: T;
	key: K;
}

export interface BanPacket {
  reason?: string;
  user: UserPacket;
}

export type AnyGuildChannel = GuildTextChannelPacket | GuildVoiceChannelPacket | GuildCategoryChannelPacket | GuildNewsChannelPacket | GuildStoreChannelPacket;
export type AnyChannel = DMChannelPacket | AnyGuildChannel;
export interface ChannelPacket {
  type: ChannelTypes;
  id: string;
}

export interface TextChannelPacket {
  last_pin_timestamp: string;
  last_message_id: string;
}

export interface DMChannelPacket {
  recipients: UserPacket[];
  type: ChannelTypes.DM;
}

export interface GuildChannelPacket extends ChannelPacket {
  permission_overwrites: PermissionOverwritePacket[];
  parent_id?: string;
  guild_id: string;
  position: number;
  name: string;
}

export interface GuildTextChannelPacket extends TextChannelPacket, GuildChannelPacket {
  rate_limit_per_user?: number;
  topic?: string;
  nsfw: boolean;
  type: ChannelTypes.Text;
}

export interface GuildVoiceChannelPacket extends GuildChannelPacket {
  user_limit?: number;
  bitrate?: number;
  type: ChannelTypes.Voice;
}

export interface GuildCategoryChannelPacket extends GuildChannelPacket {
  type: ChannelTypes.Category;
}

export interface GuildNewsChannelPacket extends GuildChannelPacket {
  topic?: string;
  nsfw?: boolean;
  type: ChannelTypes.News;
}

export interface GuildStoreChannelPacket extends GuildChannelPacket {
  type: ChannelTypes.Store;
}

export namespace Embed {
  export interface Footer {
    proxy_icon_url?: string;
    icon_url?: string;
    text: string;
  }

  export interface Image {
    proxy_url?: string;
    height?: number;
    width?: number;
    url?: string;
  }

  export interface Thumbnail extends Embed.Image {}
  export interface Video {
    height?: number;
    width?: number;
    url?: string;
  }

  export interface Provider {
    name?: string;
    url?: string;
  }

  export interface Author {
    proxy_icon_url?: string;
    icon_url?: string;
    name?: string;
    url?: string;
  }

  export interface Field {
    inline?: boolean;
    value: string;
    name: string;
  }

  export interface Structure {
    description?: string;
    thumbnail?: Embed.Thumbnail;
    timestamp?: string;
    provider?: Embed.Provider;
    footer?: Embed.Footer;
    author?: Embed.Author;
    fields?: Embed.Field[];
    color?: number;
    image?: Embed.Image;
    video?: Embed.Video;
    title?: string;
    type?: string;
    url?: string;
  }
}

export interface EmojiPacket {
  require_colons?: boolean;
  animated?: boolean;
  managed?: boolean;
  roles?: string[];
  user?: UserPacket;
  name?: string;
  id?: string;
}

export enum VerificationLevel {
  None,
  Low,
  Medium,
  High,
  VeryHigh
}

export enum GuildPremiumTier {
  None,
  Tier1,
  Tier2,
  Tier3
}

export enum MFALevel {
  None,
  Elevated
}

export enum MessageNotificationsLevel {
  AllMessages,
  OnlyMentions // i meant onlyfans, am i right (im not funny send help)
}

export enum ExplicitContentFilterLevel {
  Disabled,
  MembersWithoutRoles,
  AllMembers
}

export enum GuildFeature {
  InviteSplash = 'INVITE_SPLASH',
  VIPRegions = 'VIP_REGIONS',
  VanityUrl = 'VANITY_URL',
  Verified = 'VERIFIED',
  Partnered = 'PARTNERED',
  Public = 'PUBLIC',
  Commerce = 'COMMERCE',
  News = 'NEWS',
  Discoverable = 'DISCOVERABLE',
  Featurable = 'FEATURABLE',
  AnimatedIcon = 'ANIMATED_ICON',
  GuildBanner = 'BANNER'
}

export enum GuildRegion {
  Brazil          = 'brazil',
  Europe          = 'europe',
  HongKong        = 'hong-kong',
  India           = 'india',
  Japan           = 'japan',
  Russia          = 'russia',
  Singapore       = 'singapore',
  SouthAfrica     = 'south-africa',
  Sydney          = 'sydney',
  US_Central      = 'us-central',
  US_East         = 'us-east',
  US_South        = 'us-south',
  US_West         = 'us-west',
  EU_Central      = 'eu-central',
  EuropeWest      = 'eu-west',
  Amsterdam       = 'amsterdam',
  Frankfurt       = 'frankfurt',
  London          = 'london',
  Dubai           = 'dubai',
  SouthKorea      = 'south-korea',
  VIP_Amsterdam   = 'vip-amsterdam',
  VIP_Brazil      = 'vip-brazil',
  VIP_EU_Central  = 'vip-eu-central',
  VIP_EU_West     = 'vip-eu-west',
  VIP_Frankfurt   = 'vip-frankfurt',
  VIP_London      = 'vip-london',
  VIP_Japan       = 'vip-japan',
  VIP_Singapore   = 'vip-singapore',
  VIP_SouthAfrica = 'vip-southafrica',
  VIP_Sydney      = 'vip-sydney',
  VIP_US_Central  = 'vip-us-central',
  VIP_US_East     = 'vip-us-east',
  VIP_US_South    = 'vip-us-south',
  VIP_US_West     = 'vip-us-west'
}

export interface GuildPacket extends UnavaliableGuildPacket {
  default_message_notifications: MessageNotificationsLevel;
  premium_subscription_count?: number;
  explicit_content_filter: ExplicitContentFilterLevel;
  widget_channel_id?: string;
  system_channel_id?: string;
  verification_level: VerificationLevel;
  embed_channel_id: string;
  preferred_locale: string;
  application_id?: string;
  vanity_url_code: string;
  embed_enabled?: boolean;
  afk_channel_id: string;  
  widget_enabled: boolean;
  max_presences?: number;
  permissions?: Permissions;
  max_members?: number;
  premium_tier: GuildPremiumTier;
  unavaliable: false;
  afk_timeout: number;  
  description: string; 
  mfa_level: MFALevel;
  features: GuildFeature[];
  owner_id: string;
  splash?: string;
  emojis: EmojiPacket[];
  region: GuildRegion;
  banner: string;
  roles: RolePacket[];
  icon?: string;
  name: string;
}

export interface IntegrationAccountPacket {
  name: string;
  id: string;
}

export interface IntegrationPacket {
  expire_grace_period: number;
  expire_behaviour: number;
  synced_at: string;
  account: IntegrationAccountPacket;
  role_id: string;
  syncing: boolean;
  enabled: boolean;
  user: UserPacket;
  name: string;
  type: string;
  id: string;
}

export interface GuildMemberPacket {
  premium_since?: string;
  joined_at: string;
  roles: string[];
  nick?: string;
  deaf: boolean;
  mute: boolean;
  user: UserPacket;
}

export interface MessageChannelMentionPacket {
  guild_id: string;
  type: ChannelTypes;
  name: string;
  id: string;
}

export interface MessageActivityPacket {
  party_id?: string;
  type: number;
}

export interface MessageApplicationPacket {
  cover_image?: string;
  description: string;
  icon?: string;
  name: string;
  id: string;
}

export interface MessageReferencePacket {
  message_id?: string;
  channel_id: string;
  guild_id?: string;
}

export type MessagePacket      = GuildWebhookMessagePacket | GuildMemberMessagePacket | UserMessagePacket;
type GuildWebhookMessagePacket = GuildMessagePacket & WebhookMessagePacket;
type GuildMemberMessagePacket  = GuildMessagePacket & UserMessagePacket & MemberMessagePacket;
type Mentions                  = (UserPacket & { member: Partial<GuildMemberPacket> })[];

interface GuildMessagePacket extends BaseMessage {
  guild_id: string;
  mentions: Mentions;
}

interface MemberMessagePacket extends UserMessagePacket {
  member: MemberMessagePacket;
}

interface UserMessagePacket extends BaseMessage {
  author: UserPacket;
}

interface WebhookMessagePacket extends BaseMessage {
  webhook_id: string;
  author: WebhookPacket;
}

interface BaseMessage {
  mention_channels?: MessageChannelMentionPacket[];
  edited_timestamp: string;
  mention_everyone: boolean;
  mention_roles: string[];
  application?: MessageApplicationPacket;
  attachments: AttachmentPacket[];
  reactions?: MessageReactionPacket[];
  channel_id: string;
  timestamp: string;
  activity?: MessageActivityPacket;
  mentions: UserPacket[];
  content: string;
  embeds: Embed.Structure[];
  nonce?: number | string;
  pinned: boolean;
  flags?: number;
  type: MessageTypes;
  tts: boolean;
  id: string;
}

export enum PermissionOverwriteType {
  Member = 'member',
  Role   = 'role'
}

export interface PermissionOverwritePacket {
  allow: number;
  deny: number;
  type: PermissionOverwriteType;
  id: string;
}

interface ClientStatus {
  desktop?: string;
  mobile?: string;
  web?: string;
}

/**
 * The activity options to add to the RPC instance
 */
export interface Activity {
  /**
   * The state of the RPC being used
   * 
   * **NOTE**: The state is on the bottom of the text
   */
  state?: string;

  /**
   * The details of the RPC being used
   * 
   * **NOTE**: The details is on the top of the text
   */
  details?: string;

  /**
   * If the RPC is an instance of something
   */
  instance?: boolean;

  /**
   * Timestamps object, to check on the `Elapsed`/`Ends At` text of the RPC
   */
  timestamps?: {
    /**
     * The start of the timestamp
     */
    start?: number;

    /**
     * The end of the timestamp
     */
    end?: number;
  }

  /**
   * Any assets to use when a user is using the RPC
   */
  assets?: {
    /**
     * The image key to use
     */
    large_image?: string;

    /**
     * The text when the large image is hovered
     */
    large_text?: string;

    /**
     * The small image key
     */
    small_image?: string;

    /**
     * The text when the small image key is hovered
     */
    small_text?: string;
  }

  /**
   * The party object, the ability to join/spectate on games
   */
  party?: {
    /**
     * The ID of the party
     */
    id?: any;

    /**
     * The size of the party
     */
    size?: number[];
  }

  /**
   * Any secret keys to use when a user joins/spectates/matches on a game
   */
  secrets?: {
    /**
     * The join key, when a user can join the game
     */
    join?: string;

    /**
     * The spectate key, when a user can spectate on a user during a match
     */
    spectate?: string;

    /**
     * The match key, when a user can join the other user's match
     */
    match?: string;
  }

  /**
   * Any emojis listed
   */
  emoji?: {
    animated?: boolean;
    name: string;
    id?: string;
  }
}

export interface PresencePacket {
  premium_since?: string;
  client_status: ClientStatus;
  activities: Activity[];
  guild_id: string;
  status: 'offline' | 'online' | 'idle' | 'dnd';
  nick?: string;
  roles: string[];
  game: Activity;
  user: UserPacket | { id: string; } // object if the user isn't cached by Discord?
}

export interface MessageReactionPacket {
  emoji: Partial<EmojiPacket>;
  count: number;
  me: boolean;
}

export interface RolePacket {
  mentionable: boolean;
  permissions: number;
  position: number;
  managed: boolean;
  hoist: boolean;
  color: number;
  name: string;
  id: string;
}

export interface VoiceStatePacket {
  self_stream?: boolean;
  channel_id: string;
  session_id: string;
  guild_id?: string;
  self_mute: boolean;
  self_deaf: boolean;
  supress: boolean;
  user_id: string;
  member?: GuildMemberPacket;
  deaf: boolean;
  mute: boolean;
}

export interface WebhookPacket {
  username: string;
  avatar?: string;
  id: string;
}

export interface HelloEvent extends Event {
  op: OPCodes.Hello;
  d: { heartbeat_interval: number | null; }
}

export interface HeartbeatEvent extends Event {
  op: OPCodes.Heartbeat;
  d: number | null;
}

export interface HeartbeatAckedEvent extends Event {
  op: OPCodes.HeartbeatAck;
}

export interface InvalidSessionEvent extends Event {
  op: OPCodes.InvalidSession;
  d: boolean;
}

export interface ReconnectEvent extends Event {
  op: OPCodes.Reconnect;
}

export interface ReadyEvent extends DispatchEvent {
  t: EventType.Ready;
  d: {
    private_channels: any[]; // debug this asap
    session_id: string;
    guilds: UnavaliableGuildPacket[];
    shard: [number, number]; // tuple being [shardID, numOfShards]
    user: UserPacket;
    v: 5 | 6 | 7;
  }
}

export interface ResumedEvent extends DispatchEvent {
  t: EventType.Resumed;
}

export interface ChannelCreatedEvent extends DispatchEvent {
  t: EventType.ChannelCreate;
  d: AnyChannel;
}

export interface ChannelUpdatedEvent extends DispatchEvent {
  t: EventType.ChannelUpdate;
  d: AnyChannel;
}

export interface ChannelDeletedEvent extends DispatchEvent{
  t: EventType.ChannelDelete;
  d: AnyChannel;
}

export interface ChannelPinsUpdate extends DispatchEvent {
  t: EventType.ChannelPinUpdate;
  d: AnyChannel;
}

export interface GuildCreatedEvent extends DispatchEvent {
  t: EventType.GuildCreate;
  d: GuildPacket & {
    voice_states: Partial<VoiceStatePacket>[];
    member_count: number;
    unavaliable?: boolean;
    joined_at?: string;
    presences: Partial<PresencePacket>[];
    channels: ChannelPacket[];
    members: GuildMemberPacket[];
    large?: boolean;
  };
}

export interface GuildUpdatedEvent extends DispatchEvent {
  t: EventType.GuildUpdate;
  d: GuildPacket;
}

export interface GuildDeletedEvent extends DispatchEvent {
  t: EventType.GuildDelete;
  d: UnavaliableGuildPacket;
}

export interface GuildBanAddEvent extends DispatchEvent {
  t: EventType.GuildBanAdd;
  d: {
    guild_id: string;
    user: UserPacket;
  }
}

export interface GuildBanRemovedEvent extends DispatchEvent {
  t: EventType.GuildBanRemove;
  d: {
    guild_id: string;
    user: UserPacket;
  }
}

export interface GuildIntegrationsUpdatedEvent extends DispatchEvent {
  t: EventType.GuildIntegrationUpdate;
  d: { guild_id: string; }
}

export interface GuildMemberAddEvent extends DispatchEvent {
  t: EventType.GuildMemberAdd;
  d: GuildMemberPacket & { guild_id: string; }
}

export interface GuildMemberRemoveUpdate extends DispatchEvent {
  t: EventType.GuildMemberDelete;
  d: {
    guild_id: string;
    user: UserPacket;
  }
}

export interface GuildMemberUpdatedEvent extends DispatchEvent {
  t: EventType.GuildMemberUpdate;
  d: {
    guild_id: string;
    roles: string[];
    user: UserPacket;
    nick: string;
  }
}

export interface GuildMemberChunkEvent extends DispatchEvent {
  t: EventType.GuildMemberChunk;
  d: {
    chunk_count: number;
    chunk_index: number;
    presences?: PresencePacket[];
    not_found?: any[]; // debug this (if we can)
    guild_id: string;
    members: GuildMemberPacket[];
    nonce?: string;
  }
}

export interface GuildRoleCreatedEvent extends DispatchEvent {
  t: EventType.GuildRoleCreate;
  d: {
    guild_id: string;
    role: RolePacket;
  }
}

export interface GuildRoleUpdatedEvent extends DispatchEvent {
  t: EventType.GuildRoleUpdate;
  d: {
    guild_id: string;
    role: RolePacket;
  }
}

export interface GuildRoleDeletedEvent extends DispatchEvent {
  t: EventType.GuildRoleUpdate;
  d: {
    guild_id: string;
    role_id: string;
  }
}

export interface MessageCreatedEvent extends DispatchEvent {
  t: EventType.MessageCreated;
  d: MessagePacket;
}

export interface MessageUpdatedEvent extends DispatchEvent {
  t: EventType.MessageUpdate;
  d: MessagePacket | Partial<MessagePacket>;
}

export interface MessageDeletedEvent extends DispatchEvent {
  t: EventType.MessageDelete;
  d: {
    channel_id: string;
    guild_id?: string;
    id: string;
  }
}

export interface MessageDeleteBulkEvent extends DispatchEvent {
  t: EventType.MessageDeleteBulk;
  d: {
    channel_id: string;
    guild_id?: string;
    ids: string[];
  }
}

export interface MessageReactionAddEvent extends DispatchEvent {
  t: EventType.MessageReactionAdd;
  d: {
    message_id: string;
    channel_id: string;
    guild_id?: string;
    user_id: string;
    member?: GuildMemberPacket;
    emoji: Partial<EmojiPacket>;
  }
}

export interface MessageReactionRemoveEvent extends DispatchEvent {
  t: EventType.MessageReactionRemove;
  d: {
    channel_id: string;
    message_id: string;
    guild_id?: string;
    user_id: string;
    emoji: Partial<EmojiPacket>;
  }
}

export interface MessageReactionRemoveAllEvent extends DispatchEvent {
  t: EventType.MessageReactionRemoveAll;
  d: {
    channel_id: string;
    message_id: string;
    guild_id?: string;
  }
}

// discord why does this exist ur making me cringe help
export interface MessageReactionRemoveEmojiEvent extends DispatchEvent {
  t: EventType.MessageReactionRemoveEmoji;
  d: {
    channel_id: string;
    message_id: string;
    guild_id?: string;
    emoji: Partial<EmojiPacket>;
  }
}

export interface PresenceUpdateEvent extends DispatchEvent {
  t: EventType.PresenceUpdate;
  d: PresencePacket;
}

// again: why does this exist
export interface TypingStartEvent extends DispatchEvent {
  t: EventType.TypingStart;
  d: {
    channel_id: string;
    guild_id?: string;
    timestamp: string;
    user_id: string;
    member?: GuildMemberPacket;
  }
}

export interface UserUpdateEvent extends DispatchEvent {
  t: EventType.UserUpdate;
  d: UserPacket;
}

export interface VoiceStateUpdateEvent extends DispatchEvent {
  t: EventType.VoiceStateUpdate;
  d: VoiceStatePacket & { guild_id: string }
}

export interface VoiceServerUpdateEvent extends DispatchEvent {
  t: EventType.VoiceServerUpdate;
  d: {
    guild_id: string;
    endpoint: string;
    token: string;
  }
}

export interface WebhooksUpdateEvent extends DispatchEvent {
  t: EventType.WebhookUpdate;
  d: {
    channel_id: string;
    guild_id: string;
  }
}

export interface GiftCodeUpdateEvent extends DispatchEvent {
  t: EventType.GiftCodeUpdate;
  d: {
    channel_id: string;
    guild_id: string;
    sku_id: string;
    uses: number;
    code: string;
  }
}