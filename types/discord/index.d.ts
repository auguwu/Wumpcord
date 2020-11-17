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

/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable camelcase */

/**
 * Namespace for all Discord-related objects that don't bleed into the `core` module
 */

import { Collection } from '@augu/immutable';
import * as discord from 'discord-api-types/v8';
import { UserInfo } from 'os';
import * as core from '../core';

// Gateway-related content
export interface Gateway {
  url: string;
}

export interface BotGateway extends Gateway {
  session_start_limit: SessionStartLimit;
  shards: number;
}

export interface SessionStartLimit {
  reset_after: number;
  remaning: number;
  total: number;
}

type AnyGuildChannel = TextChannel | VoiceChannel | StoreChannel | NewsChannel;
type AnyChannel = TextChannel | DMChannel | GroupChannel | VoiceChannel | StoreChannel | NewsChannel;
type EditGuildRoleOptions = CreateRoleOptions;

// Extendable objects
interface Editable {
  edit(
    content: string | CreateMessageOptions | MessageFile | MessageFile[],
    options?: CreateMessageOptions | MessageFile | MessageFile[]
  ): Promise<Message>;
}

interface Textable {
  permissionsOf(memberID: string): core.Permissions;
  awaitMessages(filter: core.FilterFunction<Message>, time?: number): void;
  startTyping(count?: number): Promise<void>;
  getMessages(amount: number, options?: GetMessageOptions): Promise<Message[]>;
  stopTyping(force?: boolean): Promise<void>;
  bulkDelete(messageIDs: (string | Message)[]): Promise<string[]>;
  deletePin(message: Message): Promise<void>;
  getTyping(userID: string): core.UserTyping | null;
  getPins(): Promise<Message[]>;
  addPin(message: Message): Promise<void>;
  send(
    content: string | CreateMessageOptions | MessageFile[] | MessageFile,
    options?: CreateMessageOptions | MessageFile[] | MessageFile
  ): Promise<Message>;
}

interface CreateMessageOptions {
  allowedMentions?: core.AllowedMentions;
  content: string;
  embed?: discord.APIEmbed;
  file?: MessageFile;
  tts?: boolean;
}

interface MessageFile {
  name?: string;
  file: core.Multipart | Buffer;
}

interface FetchGuildMembersOptions {
  presences?: boolean;
  userIds?: string[];
  limit?: number;
  nonce?: string;
  query?: string;
  force?: boolean;
  time?: number;
}

interface BanOptions {
  reason?: string;
  days?: number;
}

interface PermissionOverwriteObject {
  allow: number;
  deny: number;
  type: 'role' | 'member';
  id: string;
}

interface CreateChannelOptions {
  permissionOverwrites?: Array<PermissionOverwriteObject>;
  ratelimitPerUser?: number;
  userLimit?: number;
  position?: number;
  parentID?: string;
}

interface EditGuildOptions {}

interface EditGuildMemberOptions {}

interface CreateRoleOptions {}

interface GuildPruneOptions {}

interface FetchGuildAuditLogsOptions {}

interface CreateEmojiOptions {}

interface ModifyEmojiOptions {
  roles?: string[];
  name?: string;
  id: string;
}

interface PresencePacket {
  client_status: RawClientStatus;
  activities: Array<discord.GatewayActivity>;
  status: 'online' | 'offline' | 'dnd' | 'away';
  user: discord.APIUser;
}

interface RawClientStatus {
  desktop?: boolean;
  mobile?: boolean;
  web?: boolean;
}

interface ClientStatus {
  desktop: boolean;
  mobile: boolean;
  website: boolean;
}

// Discord API objects made for Wumpcord
export class Activity {
  constructor(data: discord.GatewayActivity);

  public timestamps: discord.GatewayActivity['timestamps'];
  public sessionID?: string;
  public createdAt: Date;
  public details: discord.GatewayActivity['details'];
  public syncID?: string;
  public emoji?: PartialEmoji;
  public state: discord.GatewayActivity['state'];
  public party: discord.GatewayActivity['party'];
  public type: string;
  public name: string;
  public rpc: boolean;
  public id: string;
}

export class Application extends Base {
  constructor(client: core.Client, data: discord.APIApplication);

  public get coverUrl(): string | null;
  public get iconUrl(): string | null;
  public rpcOrigins?: string[];
  public primarySKU?: string;
  public coverImage?: string;
  public description: string;
  public codeGrant: boolean;
  public guildID?: string;
  public summary: string;
  public guild?: Guild;
  public owner: User;
  public team?: Team;
  public slug?: string;
  public icon: string | null;
  public name: string;

  public dynamicCoverUrl(format?: core.ImageFormats, size?: number): string | null;
  public dynamicIconUrl(format?: core.ImageFormats, size?: number): string | null;
}

export class Attachment extends Base {
  constructor(data: discord.APIAttachment);

  public proxyUrl: string;
  public height: string;
  public width: string;
  public size: string;
  public url: string;
}

declare class Base {
  constructor(id: string);

  public createdAt: Date;
  public id: string;
}

export class BaseChannel extends Base {
  constructor(data: discord.APIChannel);

  public static from(client: core.Client, data: any): AnyChannel;
  public type: string;
}

export class BotUser extends User {
  public mfaEnabled: boolean;
  public verified: boolean;
}

export class Emoji extends Base {
  constructor(client: core.Client, data: discord.APIEmoji);

  public requireColons: boolean;
  public available: boolean;
  public animated: boolean;
  public guildID: string;
  public managed: boolean;
  public name: string;

  public get mention(): string;
  public get guild(): Guild | null;
}

export class UnavailableGuild extends Base {
  constructor(data: discord.APIUnavailableGuild);

  public unavailable: boolean;
}

export class Guild extends UnavailableGuild {
  constructor(client: core.Client, data: discord.APIGuild);

  // Stores
  public voiceStates: core.VoiceStateStore;
  public presences: core.PresenceStore;
  public channels: core.ChannelStore;
  public members: core.GuildMemberStore;
  public emojis: core.GuildEmojiStore;
  public roles: core.GuildRoleStore;

  // Data
  public defaultMessageNotifications: number;
  public publicUpdatesChannelID: string;
  public explicitContentFilter: number;
  public systemChannelFlags: number;
  public verificationLevel: number;
  public discoverySplash?: string;
  public systemChannelID?: string;
  public widgetChannelID?: string;
  public applicationID?: string;
  public maxStreamUsers: number;
  public rulesChannelID: string;
  public afkChannelID?: string;
  public vanityCodeUrl: string | null;
  public widgetEnabled: boolean;
  public description?: string;
  public maxPresences: number;
  public memberCount: number;
  public afkTimeout?: number;
  public maxMembers: number;
  public boostTier: number;
  public boosters: number;
  public mfaLevel: number;
  public features: core.Constants.GuildFeatures[];
  public shardID: number;
  public ownerID: string;
  public banner?: string;
  public splash?: string;
  public region: string;
  public icon?: string;
  public name: string;

  // Getters
  public get shard(): core.WebSocketShard | null;
  public get owner(): User | null;

  // Functions
  public fetchMembers(options?: FetchMembersOptions): Promise<Collection<GuildMember>>;
  public delete(): Promise<void>;
  public ban(userID: string, options?: BanMemberOptions): Promise<void>;
  public unban(userID: string): Promise<void>;
  public createChannel(options: CreateChannelOptions): Promise<BaseChannel>;
  public getRegions(): Promise<Array<VoiceRegion>>;
  public getRegionIds(): string;
  public getPreview(): Promise<GuildPreview>;
  public getChannels(): Promise<Array<BaseChannel>>;
  public fetchMember(memberID: string): Promise<GuildMember>;
  public edit(options: EditGuildOptions): Promise<this>;
  public modifyChannelPosition(id: string, pos: number): Promise<void>;
  public editMember(memberID: string, options: EditGuildMemberOptions): Promise<void>;
  public addRole(memberID: string, roleID: string): Promise<void>;
  public removeRole(memberID: string, roleID: string): Promise<void>;
  public kickMember(memberID: string): Promise<void>;
  public getBans(): Promise<Array<GuildBan>>;
  public getRoles(): Promise<Array<Role>>;
  public createRole(options: CreateRoleOptions): Promise<Role>;
  public deleteRole(roleID: string): Promise<void>;
  public modifyRole(roleID: string, options: EditGuildRoleOptions): Promise<void>;
  public modifyRolePosition(roleID: string, pos: number): Promise<void>;
  public prune(options: GuildPruneOptions): Promise<void>;
  public getInvites(): Promise<Array<GuildInvite>>;
  public getAuditLogs(options?: FetchGuildAuditLogsOptions): Promise<AuditLogs>;
  public getEmojis(): Promise<Array<Emoji>>;
  public getEmoji(id: string): Promise<Emoji>;
  public modifyEmoji(options: ModifyEmojiOptions): Promise<Emoji>;
  public deleteEmoji(id: string): Promise<void>;
  public getWebhooks(): Promise<Webhook>;

  /**
   * Function is not implemented, do not use.
   */
  public createEmoji(): void;
}

export class GuildInvite extends Base {
  constructor(client: core.Client, data: discord.APIInvite);

  public createdAt: Date;
  public temporary: boolean;
  public maxUses: number;
  public inviter: core.User;
  public channel: core.PartialEntity<AnyGuildChannel>;
  public maxAge: number;
  public guild: core.PartialEntity<Guild>;
  public uses: number;
  public code: string;

  public delete(): Promise<void>;
  public fetch(): Promise<this>;
}

export class GuildMember extends Base {
  constructor(client: core.Client, data: discord.APIGuildMember);

  public hoistedRoleID: string | null;
  public boostedAt: Date | null;
  public joinedAt: Date;
  public deafend: boolean;
  public guildID: string;
  public roles: core.GuildRoleStore;
  public muted: boolean;
  public nick?: string;
  public user: core.User;

  public get hoistedRole(): core.GuildRole | null;
  public get permission(): core.Permissions;
  public ban(opts?: BanOptions): Promise<void>;
  public unban(): Promise<void>;
  public fetch(): Promise<this>;
  public edit(opts: EditGuildMemberOptions): Promise<void>;
  public addRole(roleID: string, reason?: string): Promise<void>;
  public removeRole(roleID: string | core.GuildRole, reason?: string): Promise<void>;
  public setNick(nick: string, reason?: string): Promise<void>;
  public mute(reason?: string): Promise<void>;
  public unmute(reason?: string): Promise<void>;
  public deafen(reason?: string): Promise<void>;
  public undeafen(reason?: string): Promise<void>;
  public switch(channelID: string, reason?: string): Promise<void>;
  public getDMChannel(): Promise<DMChannel>;
}

export class Message extends Base {
  constructor(client: core.Client, data: discord.APIMessage);

  public editedTimestamp?: Date;
  public mentionEveryone: boolean;
  public mentionRoles: GuildRoleStore;
  public attachments: core.CachableObject<Attachment>;
  public channelID: string;
  public mentions: UserStore;
  public stickers: Sticker[];
  public content: string;
  public guildID: string;
  public member?: GuildMember;
  public author: User;
  public embeds: discord.APIEmbed[];
  public edits: Collection<Message>;
  public flags: number;
  public tts: boolean;

  public get edited(): Message | null;

  public deleteReactions(): Promise<void>;
  public getReactions(reaction: string | Emoji, options?: GetMessageReactionOptions): Promise<Array<User>>;
  public getChannel(): Promise<AnyGuildChannel>;
  public crosspost(): Promise<Message>;
  public getGuild(): Promise<Guild>;
  public paginate(options?: core.PaginationBuilderOptions): Promise<core.PaginationBuilder>;
  public unreact(reaction: string | Emoji, userID?: string): Promise<void>;
  public delete(): Promise<void>;
  public react(reaction: string | Emoji, userID?: string): Promise<void>;
  public unpin(): Promise<void>;
  public edit(content: string | CreateMessageOptions, options?: CreateMessageOptions): Promise<Message>;
  public pin(): Promise<void>;
}

export class PermissionOverwrite extends Base {
  constructor(data: discord.APIOverwrite);

  public permissions: core.Permissions;
  public type: 'role' | 'member';
}

export class Presence extends Base {
  constructor(client: core.Client, data: PresencePacket);

  public clientStatus: ClientStatus;
  public activities: core.CachableObject<Activity>;
  public current?: Activity;
  public status: 'online' | 'offline' | 'dnd' | 'away';
  public user: User;
}
