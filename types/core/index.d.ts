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

/* eslint-disable @typescript-eslint/ban-types */

import { ClientOptions as WebSocketClientOptions } from 'ws';
import { HttpClient, HttpMethod } from '@augu/orchid';
import { Collection, Queue } from '@augu/immutable';
import { interactions } from './interactions';

import {
  SessionStartLimit,
  Application,
  Guild,
  User,
  BaseChannel,
  Message,
  GuildMember,
  Role,
  Gateway,
  BotGateway,
  VoiceRegion,
  GuildEmoji,
  Invite,
  TextChannel,
  MemberChunk,
  MessageFile,
  BotUser
} from '../discord';

type ImageFormats = 'jpg' | 'png' | 'webp' | 'jpeg' | 'gif';
type PermissionObject = {
  [x in Constants.KeyedPermissions]?: boolean;
};

type CachableObject<T> = Collection<T> | null;
type TypedObject<K extends string | number | symbol, V = unknown> = { [x in K]: V };
type PackStrategy = (...args: any[]) => string;
type UnpackStrategy = (...args: any[]) => any;
type ActivityType = 'online' | 'offline' | 'idle' | 'dnd';
type PartialEntity<T> = T | TypedObject<'id', string>;

interface ClientOptions {
  populatePresences?: boolean;
  allowedMentions?: AllowedMentions;
  interations?: boolean;
  getAllUsers?: boolean;
  disabledEvents?: Constants.Event[];
  shardCount?: 'auto' | number;
  strategy?: 'etf' | 'json';
  token: string;
  ws?: WebSocketOptions;
}

interface WebSocketOptions {
  guildSubscriptions?: boolean;
  largeThreshold?: number;
  connectTimeout?: number;
  clientOptions?: WebSocketClientOptions;
  compress?: boolean;
  intents?: number | number[] | (keyof Constants.GatewayIntents)[];
  tries?: number;
}

interface AllowedMentions {
  everyone?: boolean;
  roles?: boolean | string[];
  users?: boolean | string[];
}

interface UserTyping {
  lastTimestamp: Date;
  elapsedTime: number;
  timeout: NodeJS.Timeout;
  channel: string | TextChannel;
  since: Date;
  user: string | User;
}

interface ShardInfo {
  session?: SessionStartLimit;
  shards: number;
  auto: boolean;
  url: string;
}

interface FormattedAllowedMentions extends AllowedMentions {
  parse?: ('roles' | 'users' | 'everyone')[];
}

interface RestRatelimitInfo {
  retryAfter: number;
  enedpoint: string;
  global: boolean;
  method: HttpMethod;
  rest: number;
}

interface WebSocketShardEvents {
  disconnect(id: number): void;
  establish(id: number): void;
  resume(id: number, replayed: number): void;
  error(id: number, error: any): void;
  debug(id: number, message: string): void;
  close(id: number, error: any, recoverable: boolean): void;
  ready(id: number, guilds: Set<string>): void;
  ready(id: number): void;
  event(id: number, data: any): void;
  warn(id: number, message: string): void;
}

interface WebSocketClientEvents {
  // Channels
  channelPinsUpdate(channel: BaseChannel, old: Date, now: Date): void;
  channelCreate(channel: BaseChannel): void;
  channelDelete(channel: BaseChannel): void;
  channelUpdate(old: PartialEntity<BaseChannel>, channel?: BaseChannel): void;

  // Guilds
  guildIntegrationsUpdate(guild: PartialEntity<Guild>): void;
  guildMemberRemove(guild: PartialEntity<Guild>, member: PartialEntity<GuildMember>): void;
  guildEmojisUpdate(guild: PartialEntity<Guild>, old: GuildEmoji[], now: GuildEmoji[]): void;
  guildMemberUpdate(old: PartialEntity<GuildMember>, now?: GuildMember): void;
  guildMemberChunk(guild: PartialEntity<Guild>, member: PartialEntity<GuildMember>, chunk: MemberChunk): void;
  guildRoleRemove(role: PartialEntity<Role>): void;
  guildRoleUpdate(role: PartialEntity<Role>): void;
  guildMemberAdd(guild: PartialEntity<Guild>, member: PartialEntity<GuildMember>): void;
  guildBanRemove(guild: PartialEntity<Guild>, user: User): void;
  guildRoleAdd(role: PartialEntity<Role>): void;
  guildBanAdd(guild: PartialEntity<Guild>, user: User): void;
  guildCreate(guild: PartialEntity<Guild>): void;
  guildDelete(guild: PartialEntity<Guild>): void;
  guildUpdate(old: PartialEntity<Guild>, now?: Guild): void;

  // Invites
  inviteCreate(invite: Invite): void;
  inviteDelete(invite: Invite): void;

  // Messages
  messageReactionRemoveEmoji(message: PartialEntity<Message>, emoji: GuildEmoji): void;
  messageReactionRemoveAll(message: PartialEntity<Message>, emoji: GuildEmoji): void;
  messageReactionRemove(message: PartialEntity<Message>, user: PartialEntity<User>, emoji: GuildEmoji): void;
  messageReactionAdd(message: PartialEntity<Message>, user: PartialEntity<User>, emoji: GuildEmoji): void;
  messageDeleteBulk(message: Array<PartialEntity<Message>>): void; // eslint-disable-line
  messageCreate(message: Message): void;
  messageDelete(message: PartialEntity<Message>): void;
  messageUpdate(old: PartialEntity<Message>, now?: Message): void;

  // Rest Client
  restUnratelimit(): void;
  restBodyEmpty(): void;
  restRatelimit(info: RestRatelimitInfo): void;
  restCall(props: RestCallProperties): void;

  // Normal
  debug(message: string): void;
  error(error: any): void;
  warn(message: string): void;
}

interface SendActivityOptions {
  name: string;
  type: string;
  url?: string;
  afk?: boolean;
}

interface RatelimitBucket {
  resolve(value?: any | PromiseLike<any>): void;
  reject(error: DiscordRESTError): void;
  opts: DispatchOptions;
}

interface DispatchOptions<T = unknown> {
  endpoint: string;
  headers: TypedObject<string, any>;
  method: HttpMethod;
  data?: T;
}

interface RestCallProperties {
  successful: boolean;
  endpoint: string;
  method: HttpMethod;
  status: string;
}

/**
 * Represents a class to emit events from a class
 */
declare class EventBus<T extends object> {
  private listeners: { [x: string]: keyof T };

  public emit<K extends keyof T>(event: K, ...args: any[]): boolean;
  public on<K extends keyof T>(event: K, listener: T[K]): this;
  public once<K extends keyof T>(event: K, listener: T[K]): this;
  public remove<K extends keyof T>(event: K, listener: T[K]): boolean;
  public size<K extends keyof T>(event: K): number;
  public size(): number;
  public removeAllListeners(): this;
}

/**
 * Constant variables used through out Wumpcord, this is a namespace
 * but it's a object of stuff combined.
 */
export namespace Constants {
  export type GuildFeatures = 'ANIMATED_ICON' | 'BANNER' | 'COMMERECE' | 'COMMUNITY'
    | 'DISCOVERABLE' | 'FEATURABLE' | 'INVITE_SPLASH' | 'NEWS' | 'PARTNERED' | 'RELAY_ENABLED'
    | 'NEWS' | 'PARTNERED' | 'VANITY_URL' | 'VERIFIED' | 'VIP_REGIONS' | 'WELCOME_SCREEN_ENABLED';

  export type Event = 'READY' | 'RESUMED' | 'CHANNEL_CREATE' | 'CHANNEL_UPDATE'
    | 'CHANNEL_DELETE' | 'CHANNEL_PINS_UPDATE' | 'GUILD_CREATE' | 'GUILD_UPDATE' | 'GUILD_DELETE'
    | 'GUILD_BAN_ADD' | 'GUILD_BAN_REMOVE' | 'GUILD_EMOJIS_UPDATE' | 'GUILD_INTEGRATIONS_UPDATE'
    | 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_REMOVE' | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBERS_CHUNK'
    | 'GUILD_ROLE_CREATE' | 'GUILD_ROLE_DELETE' | 'GUILD_ROLE_UPDATE' | 'MESSAGE_CREATE' | 'MESSAGE_UPDATE'
    | 'MESSAGE_DELETE' | 'MESSAGE_DELETE_BULK' | 'MESSAGE_REACTION_ADD' | 'MESSAGE_REACTION_REMOVE'
    | 'MESSAGE_REACTION_REMOVE_ALL' | 'MESSAGE_REACTION_REMOVE_EMOJI' | 'TYPING_START' | 'USER_UPDATE'
    | 'VOICE_STATE_UPDATE' | 'VOICE_SERVER_UPDATE' | 'WEBHOOKS_UPDATE' | 'PRESENCE_UPDATE' | 'GIFT_CODE_UPDATE';

  export const StrategyTypes: string[];
  export const UnrecoverableCodes: number[];
  export const GatewayVersion: number;
  export const ImageFormats: ImageFormats[];
  export const RestVersion: number;
  export const UserAgent: string;
  export const CdnUrl: string;
  export const RestUrl: string;
  export namespace Endpoints {
    export function channel(channelID: string): string;
    export function webhook(id: string): string;
    export function invite(id: string): string;
    export function guild(id: string, withCounts?: boolean): string;
    export function user(id: string): string;
    export const voiceRegions: string;
    export const gatewayBot: string;
    export const channels: string;
    export const Channel: Endpoints.ChannelObject;
    export const gateway: string;
    export const users: string;
    export const Guild: Endpoints.GuildObject;
    export const User: Endpoints.UserObject;
    export const CDN: Endpoints.CDNObject;

    interface ChannelObject {
      bulkDelete(channelID: string): string;
      callRing(channelID: string): string;
      crosspost(channelID: string, messageID: string): string;
      followers(channelID: string): string;
      invites(channelID: string): string;
      messageReaction(channelID: string, messageID: string, reaction: string): string;
      messageReactionUser(channelID: string, messageID: string, reaction: string, userID: string): string;
      messageReactions(channelID: string, messageID: string): string;
      message(channelID: string, messageID: string): string;
      messagesSearch(channelID: string): string;
      permission(channelID: string, permissionID: string): string;
      permissions(channelID: string): string;
      recipient(groupID: string, userID: string): string;
      pin(channelID: string, messageID: string): string;
      pins(channelID: string): string;
      typing(channelID: string): string;
      webhooks(channelID: string): string;
    }

    interface GuildObject {
      auditLogs(guildID: string): string;
      ban(guildID: string, memberID: string): string;
      bans(guildID: string): string;
      channels(guildID: string): string;
      emoji(guildID: string, emojiID: string): string;
      emojis(guildID): string;
      integration(guildID: string, integrationID: string): string;
      integrations(guildID: string): string;
      invites(guildID: string): string;
      vanityUrl(guildID: string): string;
      member(guildID: string, memberID: string): string;
      memberNick(guildID: string, memberID: string): string;
      memberRole(guildID: string, memberID: string, roleID: string): string;
      members(guildID: string): string;
      membersSearch(guildID: string): string;
      messagesSearch(guildID: string): string;
      preview(guildID: string): string;
      prune(guildID: string): string;
      role(guildID: string, roleID: string): string;
      roles(guildID: string): string;
      voiceRegions(guildID: string): string;
      webhooks(guildID: string): string;
      widget(guildID: string): string;
    }

    interface UserObject {
      channels(userID: string): string;
      connections(userID: string): string;
      connection(userID: string, platform: string, id: string): string;
      guild(userID: string, guildID: string): string;
      guilds(userID: string): string;
      note(userID: string, targetID: string): string;
      profile(userID: string): string;
      relationship(userID: string, relID: string): string;
      settings(userID: string): string;
    }

    interface CDNObject {
      getChannelIcon(id: string, icon: string): string;
      getCustomEmoji(id: string): string;
      getDefaultAvatar(discrim: number): string;
      getGuildBanner(id: string, banner: string): string;
      getGuildIcon(id: string, icon: string): string;
      getGuildSplash(id: string, splash: string): string;
      getUserAvatar(id: string, avatar: string): string;
    }
  }

  type KeyedPermissions = 'createInstantInvite' | 'kickMembers' | 'banMembers'
    | 'administrator' | 'manageChannels' | 'manageGuild' | 'addReactions'
    | 'viewAuditLogs' | 'voicePrioritySpeaker' | 'stream' | 'readMessages'
    | 'sendMessages' | 'sendTTSMessages' | 'manageMessages' | 'embedLinks'
    | 'attachFiles' | 'readMessageHistory' | 'mentionEveryone' | 'externalEmojis'
    | 'viewGuildInsights' | 'voiceConnect' | 'voiceSpeak' | 'voiceMuteMembers'
    | 'voiceDeafenMembers' | 'voiceMoveMembers' | 'voiceUseVAD' | 'changeNickname'
    | 'manageNicknames' | 'manageRoles' | 'manageWebhooks' | 'manageEmojis'
    | 'all' | 'allGuild' | 'allText' | 'allVoice';

  type KeyedOPCodes = 'Event' | 'Heartbeat' | 'Identify' | 'StatusUpdate' | 'VoiceServerUpdate'
    | 'VoiceServerPing' | 'Resume' | 'Reconnect' | 'GetGuildMembers' | 'InvalidSession'
    | 'Hello' | 'HeartbeatAck' | 'SyncGuild' | 'SyncCall';

  type KeyedMessageTypes = 'Delete' | 'RecipientAdd' | 'RecipientRemove'
    | 'Call' | 'ChannelNameChange' | 'ChannelIconChange' | 'ChannelPinnedMessage'
    | 'GuildMemberJoin' | 'UserPremiumGuildSubscription' | 'UserPremiumGuildScriptionTier1'
    | 'UserPremiumGuildScriptionTier2' | 'UserPremiumGuildScriptionTier3' | 'ChannelFollowAdd'
    | 'GuildDiscoveryDisqualified' | 'GuildDiscoveryRequalified';

  type KeyedAuditLogActions = 'GuildUpdate' | 'ChannelCreate' | 'ChannelUpdate'
    | 'ChannelDelete' | 'ChannelOverwriteCreate' | 'ChannelOverwriteUpdate'
    | 'ChannelOverwriteDelete' | 'MemberKick' | 'MemberPrune' | 'MemberBanAdd'
    | 'MemberBanRemove' | 'MemberUpdate' | 'MemberRoleUpdate' | 'MemberMove'
    | 'MemberDisconnect' | 'BotAdd' | 'RoleCreate' | 'RoleUpdate' | 'RoleDelete'
    | 'InviteCreate' | 'InviteDelete' | 'InviteUpdate' | 'WebhookCreate' | 'WebhookUpdate'
    | 'WebhookDelete' | 'EmojiCreate' | 'EmojiUpdate' | 'EmojiDelete' | 'MessageDelete'
    | 'MessageBulkDelete' | 'MessagePin' | 'MessageUnpin' | 'IntegrationCreate'
    | 'IntegrationUpdate' | 'IntegrationDelete';

  type KeyedUserFlags = 'None' | 'Staff' | 'Partner' | 'HypesquadEvents'
    | 'BugHunterLevel1' | 'Bravery' | 'Brillance' | 'Balance' // balance is the best uwu
    | 'EarlySupporter' | 'TeamUser' | 'System' | 'BugHunterLevel2'
    | 'VerifiedBot' | 'VerifiedBotDev';

  type KeyedGatewayIntents = 'guilds' | 'guildMembers' | 'guildBans' | 'guildEmojis'
    | 'guildIntegrations' | 'guildWebhooks' | 'guildInvites' | 'guildVoiceStates'
    | 'guildPresences' | 'guildMessages' | 'guildMessageReactions' | 'guildMessageTyping'
    | 'directMessages' | 'directMessageReactions' | 'directMessageTyping';

  type KeyedGatewayEvents = 'Ready' | 'Resumed' | 'ChannelCreate' | 'ChannelUpdate'
    | 'ChannelDelete' | 'ChannelPinUpdate' | 'GuildCreate' | 'GuildUpdate' | 'GuildDelete'
    | 'GuildBanAdd' | 'GuildBanRemove' | 'GuildEmojisUpdate' | 'GuildIntegrationUpdate'
    | 'GuildMemberAdd' | 'GuildMemberDelete' | 'GuildMemberUpdate' | 'GuildMemberChunk'
    | 'GuildRoleDelete' | 'GuildRoleCreate' | 'GuildRoleUpdate' | 'MessageCreated'
    | 'MessageUpdate' | 'MessageDelete' | 'MessageDeleteBulk' | 'MessageReactionAdd'
    | 'MessageReactionRemove' | 'MessageReactionRemoveAll' | 'messageReactionRemoveEmoji'
    | 'TypingStart' | 'UserUpdate' | 'VoiceStateUpdate' | 'VoiceServerUpdate'
    | 'WebhookUpdate' | 'PresenceUpdate' | 'GiftCodeUpdate';

  type KeyedActivityFlags = 'Instance' | 'Join' | 'Spectate' | 'JoinRequest' | 'Sync' | 'Play';
  type KeyedShardStatus = 'Connected' | 'Connecting' | 'Zombie' | 'Nearly' | 'Disposed' | 'Dead' | 'WaitingForGuilds';

  export type AuditLogActions = { [x in KeyedAuditLogActions]: number };
  export type GatewayIntents = { [x in KeyedGatewayIntents]: number };
  export type ActivityFlags = { [x in KeyedActivityFlags]: number };
  export type GatewayEvents = { [x in KeyedGatewayEvents]: string };
  export type MessageTypes = { [x in KeyedMessageTypes]: number };
  export type WebhookTypes = [first: null, ...rest: string[]];
  export type ShardStatus = { [x in KeyedShardStatus]: number };
  export type Permissions = { [x in Constants.KeyedPermissions]: number };
  export type UserFlags = { [x in KeyedUserFlags]: number };
  export type OPCodes = { [x in Constants.KeyedOPCodes]: number; };

  export type MessageFlags = {
    [x in 'Crossposted' | 'IsCrosspost' | 'SupressEmbeds' | 'SourceMessageDeleted' | 'Urgent']: number;
  };

  export type ChannelTypes = {
    [x in 0 | 1 | 2 | 3 | 5 | 6]: string;
  };

  export type ActivityStatus = {
    [x in 'Playing' | 'Streaming' | 'Listening' | 'Custom' | 'Competing']: number;
  };

  export type GuildBoostTier = {
    [x in 0 | 1 | 2 | 3]: string;
  };

  export type ActivityTypes = {
    [x in 0 | 1 | 2 | 4 | 5]: string;
  }

  export type StickerType = {
    [x in 0 | 1 | 2]: string;
  };
}

declare class Multipart {
  public finished: boolean;
  public get boundary(): string;
  public append<T = unknown>(field: string, data: T, filename?: string): void;
  public finish(): Buffer[];
}

declare class Permissions {
  constructor(allowed: string, denied: string);

  public allowed: number;
  public denied: number;
  public toJSON(): PermissionObject;
  public has(permission: Constants.KeyedPermissions): boolean;
}

export namespace Util {
  export type Resolvable<T> = T | T[];

  export function get<T extends object, U = unknown>(
    prop: keyof T,
    defaultValue: U,
    options?: T
  ): U;
  export function sleep(ms: number): Promise<unknown>;
  export function formatAllowedMentions(options: ClientOptions, allowed: AllowedMentions): FormattedAllowedMentions;
  export function merge<T>(given: T, def: T): T;
  export function chunk<T>(entries: T[], chunkSize: number): T[][];
  export function toCamelCase<T, U>(obj: T): U;
  export function getAuditLogUrl(guildID: string, opts: TypedObject<string, string>): string;
  export function pluck<T, U>(obj: T, key: keyof T): U;
  export function isPromise(value: unknown): value is Promise<unknown>;
  export function getKey<T, K extends keyof T>(obj: T, key: K): T[K];
  export function resolveString(str: Resolvable<string>, sep?: string): string;
  export function clone<T>(obj: T): T;
  export function resolveColor(color: Resolvable<number> | string | Role): number;
  export function isMessageFile(value: unknown): value is MessageFile;
  export function isMultipart(value: unknown): value is Multipart;
}

declare class WebSocketShard extends EventBus<WebSocketShardEvents> {
  public unavailableGuilds: Set<string>;
  public reconnectTime: number;
  public sessionID?: string;
  public strategy: NonNullable<ClientOptions['strategy']>;
  public attempts: number;
  public status: number;
  public guilds: Collection<Guild>;
  public seq: number;
  public id: number;

  public get ping(): number;
  public get pack(): PackStrategy;
  public get unpack(): UnpackStrategy;

  public connect(): Promise<void>;
  public disconnect(reconnect?: boolean): void;
  public send<T>(op: number, data?: T): void;
  public setStatus(status: ActivityType, opts: SendActivityOptions): void;
}

declare class ShardManager extends Collection<WebSocketShard> {
  public get ping(): number;

  public spawn(id: number, strategy: NonNullable<ClientOptions['strategy']>): Promise<void>;
  public dispose(shard: WebSocketShard): void;
  public connect(id: number): Promise<void>;
}

export class Client extends EventBus<WebSocketClientEvents> {
  constructor(options: ClientOptions);

  public voiceConnections: Collection<any> | null;
  public lastShardID: number;
  public interactions: interactions.InteractionHelper | null;
  public provider: any;
  public channels: Collection<BaseChannel> | null;
  public options: ClientOptions;
  public typings: Collection<UserTyping> | null;
  public guilds: Collection<Guild> | null;
  public shards: ShardManager;
  public ready: boolean;
  public token: string;
  public users: Collection<User> | null;
  public user?: BotUser;
  public rest: RestClient;

  public get intents(): number;
  public connect(): Promise<void>;
  public getBotGateway(): Promise<BotGateway>;
  public getGateway(): Promise<Gateway>;
  public setStatus(status: ActivityType, opts: SendActivityOptions): void;
  public insert<T>(type: 'guild' | 'user' | 'channel' | 'voice', packet: T): void;
  public requestGuildMembers(): Promise<void>;
  public dispose(): void;
  public getVoiceRegions(): Promise<VoiceRegion[]>;
  public getUser(id: string): Promise<User>;
  public getGuild(id: string): Promise<Guild>;
  public getChannel(id: string): Promise<BaseChannel>;
  public getGuildMember(guildID: string, memberID: string): Promise<GuildMember>;
  public getMessage(channelID: string, messageID: string): Promise<Message>;
  public getShardInfo(): Promise<ShardInfo>;
  public getShardByGuildId(guildID: string): number;
  public getApplication(): Promise<Application>;
}

declare class RestClient {
  public lastDispatched: number;
  public ratelimited: boolean;
  public lastCall: number;
  public cache: Queue<RatelimitBucket>;
  public http: HttpClient;

  public get ping(): number;
  public dispatch<T>(opts: DispatchOptions<T>): Promise<T>;
}

declare class DiscordRESTError extends Error {
  public status: number;
}
