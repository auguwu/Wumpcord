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

/**
 * Core module of Wumpcord, this is used for exporting everything
 * that isn't available in a namespace
 */

/**
 * The available cache types
 */
type CacheType = 'guild' | 'user' | 'channel'
  | 'member' | 'member:role' | 'voice'
  | 'attachments' | 'overwrites' | 'emoji'
  | 'message' | 'presence' | 'presence:activity'
  | 'typing' | 'invites' | 'voice:connections'
  | 'audit:entries';

/**
 * Available image formats supported by Discord
 */
type ImageFormats = 'jpg' | 'png' | 'webp' | 'jpeg' | 'gif';

/**
 * The permissions object, used for `Permissions.toJSON`
 */
type PermissionObject = {
  [x in Constants.KeyedPermissions]: boolean;
};

/**
 * Represents a class to emit events from a class
 */
declare class EventBus<T extends object> {
  /** List of listeners available to this current [EventBus] */
  private listeners: { [x: string]: keyof T };

  /**
   * Emits a new event
   * @param event The event to emit
   * @param args Additional arguments to pass in
   * @returns Boolean-represented value if the event was emitted or not
   */
  public emit<K extends keyof T>(event: K, ...args: any[]): boolean;

  /**
   * Pushes a listener callback to the listeners stack
   * @param event The event to receive events from
   * @param listener The listener to run when we run [EventBus.emit]
   * @returns This [EventBus] to chain methods
   */
  public on<K extends keyof T>(event: K, listener: T[K]): this;

  /**
   * Pushes a listener callback that is only called once and is
   * removed from the callstack when emitted
   *
   * @param event The event to receive events from
   * @param listener The listener to run when we run [EventBus.emit]
   * @returns This [EventBus] instance to chain methods
   */
  public once<K extends keyof T>(event: K, listener: T[K]): this;

  /**
   * Removes a listener callback from the listeners stack
   * @param event The event to remove the listener from
   * @param listener The actual listener to remove it from
   * @returns A boolean-represented value if we removed it or not
   */
  public remove<K extends keyof T>(event: K, listener: T[K]): boolean;

  /**
   * Returns the length of listeners of a specific event
   * @param event The event
   * @returns A number of the listeners available of the specific event in this [EventBus] instance
   */
  public size<K extends keyof T>(event: K): number;

  /**
   * Returns the length of all listeners available
   * @returns A number of the listeners available to this [EventBus] instance
   */
  public size(): number;

  /**
   * Removes all of the listeners in this [EventBus] instance
   * @returns This instance to chain methods
   */
  public removeAllListeners(): this;
}

/**
 * Constant variables used through out Wumpcord, this is a namespace
 * but it's a object of stuff combined.
 */
export namespace Constants {
  /**
   * The available strategy types to encode or decode data to/from Discord
   *
   * - **etf**
   * - **json**
   */
  export const StrategyTypes: string[];

  /**
   * List of unrecoverable codes and will shutdown the bot
   */
  export const UnrecoverableCodes: number[];

  /**
   * The gateway version we use to authenicate to Discord
   */
  export const GatewayVersion: number;

  /**
   * The cache types that Wumpcord uses to
   * determine if it should be cached or not.
   */
  export const CacheType: CacheType[];

  /**
   * The image formats used to format an image from Discord's CDN
   */
  export const ImageFormats: ImageFormats[];

  /**
   * The rest version to use to use the REST API
   */
  export const RestVersion: number;

  /**
   * The User-Agent that Discord needs
   */
  export const UserAgent: string;

  /**
   * The CDN url
   */
  export const CdnUrl: string;

  /**
   * The Rest API url
   */
  export const RestUrl: string;

  /**
   * The endpoints available
   */
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

/**
 * Utility class to handle Multipart data, used for sending buffers
 * to Discord
 */
declare class Multipart {
  /**
   * If this [Multipart] instance is finished,
   * all `append` calls will be blocked if this is true.
   */
  public finished: boolean;

  /**
   * Returns the boundary
   */
  public get boundary(): string;

  /**
   * Appends an item to this [Multipart] instance
   * @param field The field name
   * @param data The data to append
   * @param filename Optional file name to set it as
   */
  public append<T = unknown>(field: string, data: T, filename?: string): void;

  /**
   * Finishes this [Multipart] instance, all `append` blocks
   * will be dismissed if this is called
   */
  public finish(): Buffer[];
}

/**
 * Utility to handle Discord permissions
 */
declare class Permissions {
  /**
   * Creates a new [Permissions] instance
   * @param allowed The allowed permissions as a string
   * @param denied The denied permissions as a string
   */
  constructor(allowed: string, denied: string);

  /**
   * The allowed permissions
   */
  public allowed: number;

  /**
   * The denied permissions
   */
  public denied: number;

  /**
   * Converts this [Permissions] into a object
   * @returns The permissions object
   */
  public toJSON(): PermissionObject;

  /**
   * Returns a boolean-represented value if we have access or not
   */
  public has(permission: Constants.KeyedPermissions): boolean;
}
